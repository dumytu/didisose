import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Search, Eye, UserCheck, Clock, CheckCircle } from 'lucide-react';

interface CounselingRequest {
  id: string;
  reason: string;
  message?: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  session_notes?: string;
  requested_at: string;
  completed_at?: string;
  student?: {
    name: string;
    student_id: string;
    class: string;
  };
  counselor?: {
    name: string;
    email: string;
  };
}

interface Counselor {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

const AdminCounseling: React.FC = () => {
  const [requests, setRequests] = useState<CounselingRequest[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<CounselingRequest | null>(null);
  const [assigningCounselor, setAssigningCounselor] = useState(false);
  const [selectedCounselorId, setSelectedCounselorId] = useState('');

  useEffect(() => {
    loadCounselingRequests();
    loadCounselors();
  }, []);

  const loadCounselingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('counseling_requests')
        .select(`
          *,
          student:users!student_id(name, student_id, class),
          counselor:users!counselor_id(name, email)
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading counseling requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, is_active')
        .eq('role', 'counselor')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCounselors(data || []);
    } catch (error) {
      console.error('Error loading counselors:', error);
    }
  };

  const handleAssignCounselor = async (requestId: string, counselorId: string) => {
    setAssigningCounselor(true);
    try {
      const { error } = await supabase
        .from('counseling_requests')
        .update({
          counselor_id: counselorId,
          status: 'accepted'
        })
        .eq('id', requestId);

      if (error) throw error;

      await loadCounselingRequests();
      setSelectedRequest(null);
      setSelectedCounselorId('');
      alert('Counselor assigned successfully!');
    } catch (error) {
      console.error('Error assigning counselor:', error);
      alert('Failed to assign counselor. Please try again.');
    } finally {
      setAssigningCounselor(false);
    }
  };

  const getFilteredRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.student?.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(request => request.status === selectedStatus);
    }

    return filtered;
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

  const getStats = () => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const activeRequests = requests.filter(r => r.status === 'accepted').length;
    const completedRequests = requests.filter(r => r.status === 'completed').length;

    return { totalRequests, pendingRequests, activeRequests, completedRequests };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Counseling Management</h1>
        <p className="text-gray-600 mt-1">Manage student counseling requests and assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.pendingRequests}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold text-blue-900">{stats.activeRequests}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-900">{stats.completedRequests}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search by student name, ID, or reason..."
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {getFilteredRequests().length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No counseling requests found</p>
            <p className="text-gray-400 text-sm">Requests will appear here when students submit them</p>
          </div>
        ) : (
          getFilteredRequests().map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusBadge(request.status)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.reason}</h3>
                  {request.message && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">{request.message}</p>
                  )}
                  <div className="space-y-1 text-sm text-gray-600">
                    {request.student && (
                      <p>
                        <strong>Student:</strong> {request.student.name} ({request.student.student_id}) - Class {request.student.class}
                      </p>
                    )}
                    {request.counselor && (
                      <p>
                        <strong>Counselor:</strong> {request.counselor.name} ({request.counselor.email})
                      </p>
                    )}
                    <p>
                      <strong>Requested:</strong> {formatDate(request.requested_at)}
                    </p>
                    {request.completed_at && (
                      <p>
                        <strong>Completed:</strong> {formatDate(request.completed_at)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                  {request.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setSelectedCounselorId('');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Assign
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Counseling Request Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {getStatusBadge(selectedRequest.status)}
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedRequest.reason}</h4>
                {selectedRequest.message && (
                  <p className="text-gray-700 whitespace-pre-line">{selectedRequest.message}</p>
                )}
              </div>

              {selectedRequest.student && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-1">Student Information</h5>
                  <p className="text-sm text-gray-700">
                    {selectedRequest.student.name} ({selectedRequest.student.student_id})
                  </p>
                  <p className="text-sm text-gray-700">Class {selectedRequest.student.class}</p>
                </div>
              )}

              {selectedRequest.counselor && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 mb-1">Assigned Counselor</h5>
                  <p className="text-sm text-blue-800">
                    {selectedRequest.counselor.name} ({selectedRequest.counselor.email})
                  </p>
                </div>
              )}

              {selectedRequest.session_notes && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="text-sm font-medium text-green-900 mb-1">Session Notes</h5>
                  <p className="text-sm text-green-800">{selectedRequest.session_notes}</p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Counselor
                  </label>
                  <select
                    value={selectedCounselorId}
                    onChange={(e) => setSelectedCounselorId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a counselor</option>
                    {counselors.map(counselor => (
                      <option key={counselor.id} value={counselor.id}>
                        {counselor.name} ({counselor.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Requested on {formatDate(selectedRequest.requested_at)}
                  {selectedRequest.completed_at && (
                    <span> • Completed on {formatDate(selectedRequest.completed_at)}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              {selectedRequest.status === 'pending' && selectedCounselorId && (
                <button
                  onClick={() => handleAssignCounselor(selectedRequest.id, selectedCounselorId)}
                  disabled={assigningCounselor}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {assigningCounselor ? 'Assigning...' : 'Assign Counselor'}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setSelectedCounselorId('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCounseling;