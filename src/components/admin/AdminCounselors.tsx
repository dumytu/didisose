import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Plus, Search, Eye, UserCheck, Mail } from 'lucide-react';

interface Counselor {
  id: string;
  email: string;
  name: string;
  contact_number?: string;
  is_active: boolean;
  created_at: string;
}

const AdminCounselors: React.FC = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [newCounselor, setNewCounselor] = useState({
    email: '',
    name: '',
    contact_number: ''
  });

  useEffect(() => {
    loadCounselors();
  }, []);

  const loadCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'counselor')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCounselors(data || []);
    } catch (error) {
      console.error('Error loading counselors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCounselor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          email: newCounselor.email,
          name: newCounselor.name,
          contact_number: newCounselor.contact_number,
          role: 'counselor',
          password_hash: '$2a$12$dummy.hash.for.new.counselor',
          is_active: true
        }]);

      if (error) throw error;

      await loadCounselors();
      setShowAddModal(false);
      setNewCounselor({
        email: '',
        name: '',
        contact_number: ''
      });
      alert('Counselor added successfully!');
    } catch (error) {
      console.error('Error adding counselor:', error);
      alert('Failed to add counselor. Please try again.');
    }
  };

  const toggleCounselorStatus = async (counselorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', counselorId);

      if (error) throw error;
      await loadCounselors();
    } catch (error) {
      console.error('Error updating counselor status:', error);
    }
  };

  const getFilteredCounselors = () => {
    if (!searchTerm) return counselors;
    
    return counselors.filter(counselor =>
      counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counselor.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counselor Management</h1>
          <p className="text-gray-600 mt-1">Manage counselor accounts and assignments</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Counselor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Counselors</p>
              <p className="text-3xl font-bold text-gray-900">{counselors.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Counselors</p>
              <p className="text-3xl font-bold text-green-900">
                {counselors.filter(c => c.is_active).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search by name or email..."
          />
        </div>
      </div>

      {/* Counselors Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counselor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredCounselors().length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No counselors found</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Add your first counselor
                    </button>
                  </td>
                </tr>
              ) : (
                getFilteredCounselors().map((counselor) => (
                  <tr key={counselor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{counselor.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {counselor.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{counselor.contact_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        counselor.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {counselor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(counselor.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedCounselor(counselor)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleCounselorStatus(counselor.id, counselor.is_active)}
                          className={`${
                            counselor.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Counselor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Counselor</h3>
            
            <form onSubmit={handleAddCounselor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newCounselor.email}
                  onChange={(e) => setNewCounselor({...newCounselor, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newCounselor.name}
                  onChange={(e) => setNewCounselor({...newCounselor, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={newCounselor.contact_number}
                  onChange={(e) => setNewCounselor({...newCounselor, contact_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                <p className="mb-1">• Default password will be set (counselor can change later)</p>
                <p>• Counselor will receive login credentials via email</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Add Counselor
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counselor Details Modal */}
      {selectedCounselor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Counselor Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="text-sm text-gray-900 mt-1">{selectedCounselor.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <p className="text-sm text-gray-900 mt-1">{selectedCounselor.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <p className="text-sm text-gray-900 mt-1">{selectedCounselor.contact_number || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  selectedCounselor.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedCounselor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Account Created</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(selectedCounselor.created_at)}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedCounselor(null)}
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

export default AdminCounselors;