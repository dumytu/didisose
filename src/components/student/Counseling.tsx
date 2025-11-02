import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, User, Clock, CheckCircle, Plus, Send, Paperclip } from 'lucide-react';

interface CounselingRequest {
  id: string;
  reason: string;
  message?: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  session_notes?: string;
  requested_at: string;
  completed_at?: string;
  counselor_id?: string;
  counselor?: {
    name: string;
    email: string;
  };
}

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  attachment_url?: string;
  sent_at: string;
  sender?: {
    name: string;
    role: string;
  };
}

const Counseling: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CounselingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CounselingRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newRequest, setNewRequest] = useState({
    reason: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCounselingRequests();
  }, [user]);

  useEffect(() => {
    if (selectedRequest) {
      loadChatMessages(selectedRequest.id);
    }
  }, [selectedRequest]);

  const loadCounselingRequests = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('counseling_requests')
        .select(`
          *,
          counselor:users!counselor_id(name, email)
        `)
        .eq('student_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading counseling requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!sender_id(name, role)
        `)
        .eq('counseling_request_id', requestId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setChatMessages(data || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.reason.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('counseling_requests')
        .insert([{
          student_id: user?.id,
          reason: newRequest.reason,
          message: newRequest.message || null,
          status: 'pending',
          requested_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await loadCounselingRequests();
      setShowNewRequestForm(false);
      setNewRequest({ reason: '', message: '' });
      alert('Counseling request submitted successfully!');
    } catch (error) {
      console.error('Error submitting counseling request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRequest) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          counseling_request_id: selectedRequest.id,
          sender_id: user?.id,
          message: newMessage.trim(),
          sent_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setNewMessage('');
      await loadChatMessages(selectedRequest.id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'accepted': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      'pending': Clock,
      'accepted': MessageCircle,
      'completed': CheckCircle,
      'cancelled': Clock
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counseling</h1>
          <p className="text-gray-600 mt-1">Get guidance and support from our counselors</p>
        </div>

        <button
          onClick={() => setShowNewRequestForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Request
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Counseling Requests */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Requests</h3>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No counseling requests</p>
                <button
                  onClick={() => setShowNewRequestForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Request your first counseling session
                </button>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedRequest?.id === request.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{request.reason}</h4>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  {request.message && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{request.message}</p>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Requested: {formatDate(request.requested_at)}</span>
                    {request.counselor && (
                      <span>Counselor: {request.counselor.name}</span>
                    )}
                  </div>

                  {request.status === 'accepted' && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      Click to open chat
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Interface */}
        {selectedRequest ? (
          <div className="bg-white rounded-xl shadow-sm border flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Chat: {selectedRequest.reason}
              </h3>
              <div className="flex items-center justify-between mt-2">
                {getStatusBadge(selectedRequest.status)}
                {selectedRequest.counselor && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-1" />
                    {selectedRequest.counselor.name}
                  </div>
                )}
              </div>
            </div>

            {selectedRequest.status === 'accepted' ? (
              <>
                {/* Messages */}
                <div className="flex-1 p-4 space-y-4 max-h-64 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatDate(message.sent_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Type your message..."
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {selectedRequest.status === 'pending' && 'Waiting for counselor to accept your request'}
                    {selectedRequest.status === 'completed' && 'This counseling session has been completed'}
                    {selectedRequest.status === 'cancelled' && 'This counseling request was cancelled'}
                  </p>
                  {selectedRequest.session_notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Session Notes:</h4>
                      <p className="text-sm text-gray-700">{selectedRequest.session_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border flex items-center justify-center">
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a counseling request</p>
              <p className="text-gray-400 text-sm">Choose a request from the left to view details or chat</p>
            </div>
          </div>
        )}
      </div>

      {/* New Request Form Modal */}
      {showNewRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Counseling</h3>
            
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Counseling
                </label>
                <select
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Academic Stress">Academic Stress</option>
                  <option value="Career Guidance">Career Guidance</option>
                  <option value="Personal Issues">Personal Issues</option>
                  <option value="Study Techniques">Study Techniques</option>
                  <option value="Exam Anxiety">Exam Anxiety</option>
                  <option value="Time Management">Time Management</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Message (Optional)
                </label>
                <textarea
                  value={newRequest.message}
                  onChange={(e) => setNewRequest({...newRequest, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Please describe your concern in detail..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewRequestForm(false);
                    setNewRequest({ reason: '', message: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Counseling;