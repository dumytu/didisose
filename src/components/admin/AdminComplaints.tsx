import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Search, Eye, MessageSquare, CheckCircle, Clock } from 'lucide-react';

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
  student?: {
    name: string;
    student_id: string;
    class: string;
  };
}

const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          student:users!student_id(name, student_id, class)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: string, notes?: string) => {
    setUpdatingStatus(true);
    try {
      const updateData: any = { status: newStatus };
      
      if (notes) {
        updateData.admin_notes = notes;
      }
      
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = '11111111-1111-1111-1111-111111111111'; // Admin ID
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId);

      if (error) throw error;

      await loadComplaints();
      setSelectedComplaint(null);
      setAdminNotes('');
      alert('Complaint status updated successfully!');
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Failed to update complaint status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getFilteredComplaints = () => {
    let filtered = complaints;

    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (!complaint.is_anonymous && complaint.student?.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === selectedStatus);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(complaint => complaint.category === selectedCategory);
    }

    return filtered;
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

  const getUniqueCategories = () => {
    const categories = complaints.map(complaint => complaint.category).filter(Boolean);
    return [...new Set(categories)].sort();
  };

  const getStats = () => {
    const totalComplaints = complaints.length;
    const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
    const inProgressComplaints = complaints.filter(c => c.status === 'in_progress').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

    return { totalComplaints, pendingComplaints, inProgressComplaints, resolvedComplaints };
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
        <h1 className="text-2xl font-bold text-gray-900">Complaint Management</h1>
        <p className="text-gray-600 mt-1">Review and resolve student complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.pendingComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-900">{stats.inProgressComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-900">{stats.resolvedComplaints}</p>
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
              placeholder="Search complaints by title, description, or student name..."
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {getFilteredComplaints().length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No complaints found</p>
            <p className="text-gray-400 text-sm">Complaints will appear here when students submit them</p>
          </div>
        ) : (
          getFilteredComplaints().map((complaint) => (
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
                        Anonymous
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{complaint.title}</h3>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">{complaint.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      {!complaint.is_anonymous && complaint.student && (
                        <span>
                          {complaint.student.name} ({complaint.student.student_id}) - Class {complaint.student.class}
                        </span>
                      )}
                      {complaint.is_anonymous && <span>Anonymous Student</span>}
                    </div>
                    <span>{getComplaintId(complaint)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedComplaint(complaint)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Submitted on {formatDate(complaint.created_at)}
                  {complaint.resolved_at && (
                    <span> • Resolved on {formatDate(complaint.resolved_at)}</span>
                  )}
                </p>
                
                {complaint.status !== 'resolved' && (
                  <div className="flex space-x-2">
                    {complaint.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(complaint.id, 'in_progress')}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        Mark In Progress
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setAdminNotes(complaint.admin_notes || '');
                      }}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Complaint Details {getComplaintId(selectedComplaint)}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedComplaint.category)}`}>
                  {selectedComplaint.category}
                </span>
                {getStatusBadge(selectedComplaint.status)}
                {selectedComplaint.is_anonymous && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    Anonymous
                  </span>
                )}
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedComplaint.title}</h4>
                <p className="text-gray-700 whitespace-pre-line">{selectedComplaint.description}</p>
              </div>

              {!selectedComplaint.is_anonymous && selectedComplaint.student && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-1">Student Information</h5>
                  <p className="text-sm text-gray-700">
                    {selectedComplaint.student.name} ({selectedComplaint.student.student_id})
                  </p>
                  <p className="text-sm text-gray-700">Class {selectedComplaint.student.class}</p>
                </div>
              )}

              {selectedComplaint.attachment_url && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Attachment</h5>
                  <a
                    href={selectedComplaint.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Attachment
                  </a>
                </div>
              )}

              {selectedComplaint.admin_notes && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 mb-1">Admin Notes</h5>
                  <p className="text-sm text-blue-800">{selectedComplaint.admin_notes}</p>
                </div>
              )}

              {selectedComplaint.status !== 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add notes about the resolution or actions taken..."
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Submitted on {formatDate(selectedComplaint.created_at)}
                  {selectedComplaint.resolved_at && (
                    <span> • Resolved on {formatDate(selectedComplaint.resolved_at)}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              {selectedComplaint.status !== 'resolved' && (
                <>
                  {selectedComplaint.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedComplaint.id, 'in_progress', adminNotes)}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {updatingStatus ? 'Updating...' : 'Mark In Progress'}
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate(selectedComplaint.id, 'resolved', adminNotes)}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {updatingStatus ? 'Resolving...' : 'Mark Resolved'}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setAdminNotes('');
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

export default AdminComplaints;