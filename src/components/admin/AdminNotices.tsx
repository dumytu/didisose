import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, Plus, Search, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'urgent' | 'class' | 'exam';
  target_class?: string;
  attachment_url?: string;
  is_active: boolean;
  created_at: string;
}

const AdminNotices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    category: 'general',
    target_class: ''
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error loading notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('notices')
        .insert([{
          title: newNotice.title,
          content: newNotice.content,
          category: newNotice.category,
          target_class: newNotice.target_class || null,
          created_by: '11111111-1111-1111-1111-111111111111', // Admin ID
          is_active: true
        }]);

      if (error) throw error;

      await loadNotices();
      setShowAddModal(false);
      setNewNotice({
        title: '',
        content: '',
        category: 'general',
        target_class: ''
      });
      alert('Notice published successfully!');
    } catch (error) {
      console.error('Error adding notice:', error);
      alert('Failed to publish notice. Please try again.');
    }
  };

  const handleEditNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    
    try {
      const { error } = await supabase
        .from('notices')
        .update({
          title: newNotice.title,
          content: newNotice.content,
          category: newNotice.category,
          target_class: newNotice.target_class || null
        })
        .eq('id', editingNotice.id);

      if (error) throw error;

      await loadNotices();
      setEditingNotice(null);
      setNewNotice({
        title: '',
        content: '',
        category: 'general',
        target_class: ''
      });
      alert('Notice updated successfully!');
    } catch (error) {
      console.error('Error updating notice:', error);
      alert('Failed to update notice. Please try again.');
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: false })
        .eq('id', noticeId);

      if (error) throw error;
      await loadNotices();
      alert('Notice deleted successfully!');
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Failed to delete notice. Please try again.');
    }
  };

  const startEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setNewNotice({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      target_class: notice.target_class || ''
    });
  };

  const getFilteredNotices = () => {
    let filtered = notices.filter(notice => notice.is_active);

    if (searchTerm) {
      filtered = filtered.filter(notice =>
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(notice => notice.category === selectedCategory);
    }

    return filtered;
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      exam: 'bg-purple-100 text-purple-800 border-purple-200',
      class: 'bg-blue-100 text-blue-800 border-blue-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const icons = {
      urgent: AlertCircle,
      exam: Bell,
      class: Bell,
      general: Bell
    };

    const Icon = icons[category as keyof typeof icons];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[category as keyof typeof styles]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {category.toUpperCase()}
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
    const activeNotices = notices.filter(n => n.is_active);
    const urgentNotices = activeNotices.filter(n => n.category === 'urgent');
    const classSpecific = activeNotices.filter(n => n.target_class);
    const generalNotices = activeNotices.filter(n => n.category === 'general');

    return { activeNotices: activeNotices.length, urgentNotices: urgentNotices.length, classSpecific: classSpecific.length, generalNotices: generalNotices.length };
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notice Management</h1>
          <p className="text-gray-600 mt-1">Create and manage school announcements</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Notice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Notices</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeNotices}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-3xl font-bold text-red-900">{stats.urgentNotices}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Class Specific</p>
              <p className="text-3xl font-bold text-purple-900">{stats.classSpecific}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">General</p>
              <p className="text-3xl font-bold text-green-900">{stats.generalNotices}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-green-600" />
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
              placeholder="Search notices by title or content..."
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="urgent">Urgent</option>
            <option value="class">Class Specific</option>
            <option value="exam">Exam Related</option>
          </select>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {getFilteredNotices().length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notices found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Create your first notice
            </button>
          </div>
        ) : (
          getFilteredNotices().map((notice) => (
            <div
              key={notice.id}
              className={`bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
                notice.category === 'urgent' ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getCategoryBadge(notice.category)}
                    {notice.target_class && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Class {notice.target_class}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{notice.title}</h3>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">{notice.content}</p>
                  <p className="text-xs text-gray-500">{formatDate(notice.created_at)}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedNotice(notice)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEdit(notice)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNotice(notice.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Notice Modal */}
      {(showAddModal || editingNotice) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingNotice ? 'Edit Notice' : 'Create New Notice'}
            </h3>
            
            <form onSubmit={editingNotice ? handleEditNotice : handleAddNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newNotice.category}
                    onChange={(e) => setNewNotice({...newNotice, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="general">General</option>
                    <option value="urgent">Urgent</option>
                    <option value="class">Class Specific</option>
                    <option value="exam">Exam Related</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Class (Optional)
                  </label>
                  <select
                    value={newNotice.target_class}
                    onChange={(e) => setNewNotice({...newNotice, target_class: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Classes</option>
                    {['6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingNotice ? 'Update Notice' : 'Publish Notice'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNotice(null);
                    setNewNotice({
                      title: '',
                      content: '',
                      category: 'general',
                      target_class: ''
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

      {/* View Notice Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notice Details</h3>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {getCategoryBadge(selectedNotice.category)}
                {selectedNotice.target_class && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Class {selectedNotice.target_class}
                  </span>
                )}
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedNotice.title}</h4>
                <p className="text-gray-700 whitespace-pre-line">{selectedNotice.content}</p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Published on {formatDate(selectedNotice.created_at)}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedNotice(null)}
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

export default AdminNotices;