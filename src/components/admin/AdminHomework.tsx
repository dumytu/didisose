import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, Plus, Search, Edit, Trash2, Calendar, Users } from 'lucide-react';

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  due_date: string;
  attachment_url?: string;
  is_active: boolean;
  created_at: string;
}

const AdminHomework: React.FC = () => {
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState<HomeworkItem | null>(null);
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    due_date: ''
  });

  useEffect(() => {
    loadHomework();
  }, []);

  const loadHomework = async () => {
    try {
      const { data, error } = await supabase
        .from('homework')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHomework(data || []);
    } catch (error) {
      console.error('Error loading homework:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('homework')
        .insert([{
          title: newHomework.title,
          description: newHomework.description,
          subject: newHomework.subject,
          class: newHomework.class,
          due_date: newHomework.due_date,
          created_by: '11111111-1111-1111-1111-111111111111', // Admin ID
          is_active: true
        }]);

      if (error) throw error;

      await loadHomework();
      setShowAddModal(false);
      setNewHomework({
        title: '',
        description: '',
        subject: '',
        class: '',
        due_date: ''
      });
      alert('Homework assigned successfully!');
    } catch (error) {
      console.error('Error adding homework:', error);
      alert('Failed to assign homework. Please try again.');
    }
  };

  const handleEditHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHomework) return;
    
    try {
      const { error } = await supabase
        .from('homework')
        .update({
          title: newHomework.title,
          description: newHomework.description,
          subject: newHomework.subject,
          class: newHomework.class,
          due_date: newHomework.due_date
        })
        .eq('id', editingHomework.id);

      if (error) throw error;

      await loadHomework();
      setEditingHomework(null);
      setNewHomework({
        title: '',
        description: '',
        subject: '',
        class: '',
        due_date: ''
      });
      alert('Homework updated successfully!');
    } catch (error) {
      console.error('Error updating homework:', error);
      alert('Failed to update homework. Please try again.');
    }
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    if (!confirm('Are you sure you want to delete this homework?')) return;
    
    try {
      const { error } = await supabase
        .from('homework')
        .update({ is_active: false })
        .eq('id', homeworkId);

      if (error) throw error;
      await loadHomework();
      alert('Homework deleted successfully!');
    } catch (error) {
      console.error('Error deleting homework:', error);
      alert('Failed to delete homework. Please try again.');
    }
  };

  const startEdit = (homeworkItem: HomeworkItem) => {
    setEditingHomework(homeworkItem);
    setNewHomework({
      title: homeworkItem.title,
      description: homeworkItem.description,
      subject: homeworkItem.subject,
      class: homeworkItem.class,
      due_date: homeworkItem.due_date
    });
  };

  const getFilteredHomework = () => {
    let filtered = homework.filter(item => item.is_active);

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(item => item.class === selectedClass);
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(item => item.subject === selectedSubject);
    }

    return filtered;
  };

  const getUniqueClasses = () => {
    const classes = homework.map(item => item.class).filter(Boolean);
    return [...new Set(classes)].sort();
  };

  const getUniqueSubjects = () => {
    const subjects = homework.map(item => item.subject).filter(Boolean);
    return [...new Set(subjects)].sort();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Homework Management</h1>
          <p className="text-gray-600 mt-1">Create and manage homework assignments</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Assign Homework
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assignments</p>
              <p className="text-3xl font-bold text-gray-900">{homework.filter(h => h.is_active).length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Classes</p>
              <p className="text-3xl font-bold text-green-900">{getUniqueClasses().length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subjects</p>
              <p className="text-3xl font-bold text-purple-900">{getUniqueSubjects().length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due Today</p>
              <p className="text-3xl font-bold text-orange-900">
                {homework.filter(h => h.is_active && h.due_date === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
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
              placeholder="Search homework by title or subject..."
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Classes</option>
            {getUniqueClasses().map(className => (
              <option key={className} value={className}>Class {className}</option>
            ))}
          </select>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Subjects</option>
            {getUniqueSubjects().map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Homework List */}
      <div className="space-y-4">
        {getFilteredHomework().length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No homework assignments</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Create your first assignment
            </button>
          </div>
        ) : (
          getFilteredHomework().map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
                isOverdue(item.due_date) ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Class {item.class}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {item.subject}
                    </span>
                    {isOverdue(item.due_date) && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-700 text-sm mb-3">{item.description}</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    Due: {formatDate(item.due_date)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteHomework(item.id)}
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

      {/* Add/Edit Homework Modal */}
      {(showAddModal || editingHomework) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingHomework ? 'Edit Homework' : 'Assign New Homework'}
            </h3>
            
            <form onSubmit={editingHomework ? handleEditHomework : handleAddHomework} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newHomework.title}
                  onChange={(e) => setNewHomework({...newHomework, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={newHomework.description}
                  onChange={(e) => setNewHomework({...newHomework, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={newHomework.subject}
                    onChange={(e) => setNewHomework({...newHomework, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Social Science">Social Science</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class *
                  </label>
                  <select
                    value={newHomework.class}
                    onChange={(e) => setNewHomework({...newHomework, class: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Class</option>
                    {['6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={newHomework.due_date}
                  onChange={(e) => setNewHomework({...newHomework, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingHomework ? 'Update Homework' : 'Assign Homework'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingHomework(null);
                    setNewHomework({
                      title: '',
                      description: '',
                      subject: '',
                      class: '',
                      due_date: ''
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

export default AdminHomework;