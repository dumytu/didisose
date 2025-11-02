import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Plus, Clock, CheckCircle, Eye, EyeOff, FileText } from 'lucide-react';

interface Complaint {
  id: string;
  category: string;
  title: string;
  description: string;
  is_anonymous: boolean;
  attachment_url?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  admin_notes?: string;
  resolved_at?: string;
  created_at: string;
}

const ComplaintBox: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    category: '',
    title: '',
    description: '',
    isAnonymous: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, [user]);

  const loadComplaints = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.category || !newComplaint.title || !newComplaint.description) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .insert([{
          student_id: user?.id,
          category: newComplaint.category,
          title: newComplaint.title,
          description: newComplaint.description,
          is_anonymous: newComplaint.isAnonymous,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await loadComplaints();
      setShowNewComplaintForm(false);
      setNewComplaint({
        category: '',
        title: '',
        description: '',
        isAnonymous: false
      });
      alert('Complaint submitted successfully!');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'resolved': 'bg-green-100 text-green-800 border-green-200'
    };

    const icons = {
      'pending': Clock,
      'in_progress': AlertTriangle,
      'resolved': CheckCircle
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Academic': 'bg-blue-100 text-blue-800',
      'Facilities': 'bg-green-100 text-green-800',
      'Transport': 'bg-yellow-100 text-yellow-800',
      'Food': 'bg-orange-100 text-orange-800',
      'Staff': 'bg-purple-100 text-purple-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
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

  const getComplaintId = (complaint: Complaint) => {
    return `#${complaint.id.slice(-8).toUpperCase()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaint Box</h1>
          <p className="text-gray-600 mt-1">Report issues and track their resolution status</p>
        </div>

        <button
          onClick={() => setShowNewComplaintForm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          File Complaint
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-900">
                {complaints.filter(c => c.status === 'in_progress').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-900">
                {complaints.filter(c => c.status === 'resolved').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No complaints filed</p>
            <p className="text-gray-400 text-sm mb-4">Your complaints will appear here once submitted</p>
            <button
              onClick={() => setShowNewComplaintForm(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              File your first complaint
            </button>
          </div>
        ) : (
          complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(complaint.category)}`}>
                      {complaint.category}
                    </span>
                    {getStatusBadge(complaint.status)}
                    {complaint.is_anonymous && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Anonymous
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{complaint.title}</h3>
                  <p className="text-gray-700 text-sm mb-3">{complaint.description}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{getComplaintId(complaint)}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(complaint.created_at)}</p>
                </div>
              </div>

              {complaint.admin_notes && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Admin Response:</h4>
                  <p className="text-sm text-blue-800">{complaint.admin_notes}</p>
                </div>
              )}

              {complaint.resolved_at && (
                <div className="mt-3 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Resolved on {formatDate(complaint.resolved_at)}
                </div>
              )}

              {complaint.attachment_url && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={complaint.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Complaint Form Modal */}
      {showNewComplaintForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">File a Complaint</h3>
            
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({...newComplaint, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Academic">Academic</option>
                  <option value="Facilities">Facilities</option>
                  <option value="Transport">Transport</option>
                  <option value="Food">Food</option>
                  <option value="Staff">Staff</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Please provide detailed information about your complaint..."
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={newComplaint.isAnonymous}
                  onChange={(e) => setNewComplaint({...newComplaint, isAnonymous: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
                  Submit anonymously
                </label>
              </div>

              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                <p className="mb-1">• All complaints are treated confidentially</p>
                <p className="mb-1">• Anonymous complaints may take longer to investigate</p>
                <p>• You will receive a tracking ID for your complaint</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewComplaintForm(false);
                    setNewComplaint({
                      category: '',
                      title: '',
                      description: '',
                      isAnonymous: false
                    });
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

export default ComplaintBox;