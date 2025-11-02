import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CreditCard, Plus, Search, Edit, DollarSign, Users, CheckCircle, Clock } from 'lucide-react';

interface Fee {
  id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  payment_date?: string;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  created_at: string;
  student?: {
    name: string;
    student_id: string;
    class: string;
  };
}

interface Scholarship {
  id: string;
  scholarship_type: string;
  amount: number;
  application_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  approved_date?: string;
  student?: {
    name: string;
    student_id: string;
    class: string;
  };
}

interface Student {
  id: string;
  name: string;
  student_id: string;
  class: string;
}

const AdminFees: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fees' | 'scholarships'>('fees');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [newFee, setNewFee] = useState({
    student_id: '',
    fee_type: '',
    amount: '',
    due_date: ''
  });

  useEffect(() => {
    loadFees();
    loadScholarships();
    loadStudents();
  }, []);

  const loadFees = async () => {
    try {
      const { data, error } = await supabase
        .from('fees')
        .select(`
          *,
          student:users!student_id(name, student_id, class)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFees(data || []);
    } catch (error) {
      console.error('Error loading fees:', error);
    }
  };

  const loadScholarships = async () => {
    try {
      const { data, error } = await supabase
        .from('scholarships')
        .select(`
          *,
          student:users!student_id(name, student_id, class)
        `)
        .order('application_date', { ascending: false });

      if (error) throw error;
      setScholarships(data || []);
    } catch (error) {
      console.error('Error loading scholarships:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, student_id, class')
        .eq('role', 'student')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('fees')
        .insert([{
          student_id: newFee.student_id,
          fee_type: newFee.fee_type,
          amount: parseFloat(newFee.amount),
          due_date: newFee.due_date,
          paid_amount: 0,
          payment_status: 'pending'
        }]);

      if (error) throw error;

      await loadFees();
      setShowAddFeeModal(false);
      setNewFee({
        student_id: '',
        fee_type: '',
        amount: '',
        due_date: ''
      });
      alert('Fee record added successfully!');
    } catch (error) {
      console.error('Error adding fee:', error);
      alert('Failed to add fee record. Please try again.');
    }
  };

  const handleScholarshipAction = async (scholarshipId: string, action: 'approved' | 'rejected', reason?: string) => {
    try {
      const updateData: any = {
        status: action,
        approved_by: '11111111-1111-1111-1111-111111111111' // Admin ID
      };

      if (action === 'approved') {
        updateData.approved_date = new Date().toISOString().split('T')[0];
      }

      if (reason) {
        updateData.reason = reason;
      }

      const { error } = await supabase
        .from('scholarships')
        .update(updateData)
        .eq('id', scholarshipId);

      if (error) throw error;

      await loadScholarships();
      setSelectedScholarship(null);
      alert(`Scholarship ${action} successfully!`);
    } catch (error) {
      console.error('Error updating scholarship:', error);
      alert('Failed to update scholarship. Please try again.');
    }
  };

  const getFilteredFees = () => {
    let filtered = fees;

    if (searchTerm) {
      filtered = filtered.filter(fee =>
        fee.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.student?.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.fee_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(fee => fee.student?.class === selectedClass);
    }

    return filtered;
  };

  const getFilteredScholarships = () => {
    let filtered = scholarships;

    if (searchTerm) {
      filtered = filtered.filter(scholarship =>
        scholarship.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scholarship.student?.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scholarship.scholarship_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(scholarship => scholarship.student?.class === selectedClass);
    }

    return filtered;
  };

  const getUniqueClasses = () => {
    const classes = fees.map(fee => fee.student?.class).filter(Boolean);
    return [...new Set(classes)].sort();
  };

  const getStatusBadge = (status: string, type: 'fee' | 'scholarship') => {
    if (type === 'fee') {
      const styles = {
        'paid': 'bg-green-100 text-green-800 border-green-200',
        'partial': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'pending': 'bg-orange-100 text-orange-800 border-orange-200',
        'overdue': 'bg-red-100 text-red-800 border-red-200'
      };

      const icons = {
        'paid': CheckCircle,
        'partial': Clock,
        'pending': Clock,
        'overdue': Clock
      };

      const Icon = icons[status as keyof typeof icons];

      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
          <Icon className="w-3 h-3 mr-1" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    } else {
      const styles = {
        'approved': 'bg-green-100 text-green-800 border-green-200',
        'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'rejected': 'bg-red-100 text-red-800 border-red-200'
      };

      const icons = {
        'approved': CheckCircle,
        'pending': Clock,
        'rejected': Clock
      };

      const Icon = icons[status as keyof typeof icons];

      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
          <Icon className="w-3 h-3 mr-1" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getFeeStats = () => {
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const collectedFees = fees.reduce((sum, fee) => sum + fee.paid_amount, 0);
    const pendingFees = totalFees - collectedFees;
    const overdueFees = fees.filter(f => f.payment_status === 'overdue').length;

    return { totalFees, collectedFees, pendingFees, overdueFees };
  };

  const getScholarshipStats = () => {
    const totalApplications = scholarships.length;
    const pendingApplications = scholarships.filter(s => s.status === 'pending').length;
    const approvedApplications = scholarships.filter(s => s.status === 'approved').length;
    const approvedAmount = scholarships
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.amount, 0);

    return { totalApplications, pendingApplications, approvedApplications, approvedAmount };
  };

  const feeStats = getFeeStats();
  const scholarshipStats = getScholarshipStats();

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
          <h1 className="text-2xl font-bold text-gray-900">Fee & Scholarship Management</h1>
          <p className="text-gray-600 mt-1">Manage student fees and scholarship applications</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('fees')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'fees'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Fee Records
            </button>
            <button
              onClick={() => setActiveTab('scholarships')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'scholarships'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Scholarships
            </button>
          </div>

          {activeTab === 'fees' && (
            <button
              onClick={() => setShowAddFeeModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Fee Record
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {activeTab === 'fees' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Fees</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(feeStats.totalFees)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collected</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(feeStats.collectedFees)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(feeStats.pendingFees)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-900">{feeStats.overdueFees}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-3xl font-bold text-gray-900">{scholarshipStats.totalApplications}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">{scholarshipStats.pendingApplications}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-900">{scholarshipStats.approvedApplications}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Amount Approved</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(scholarshipStats.approvedAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

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
              placeholder="Search by student name, ID, or type..."
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
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'fees' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredFees().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No fee records found</p>
                    </td>
                  </tr>
                ) : (
                  getFilteredFees().map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{fee.student?.name}</div>
                          <div className="text-sm text-gray-500">
                            {fee.student?.student_id} • Class {fee.student?.class}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fee.fee_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(fee.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(fee.paid_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(fee.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(fee.payment_status, 'fee')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {getFilteredScholarships().length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No scholarship applications found</p>
            </div>
          ) : (
            getFilteredScholarships().map((scholarship) => (
              <div
                key={scholarship.id}
                className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusBadge(scholarship.status, 'scholarship')}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{scholarship.scholarship_type}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {scholarship.student && (
                        <p>
                          <strong>Student:</strong> {scholarship.student.name} ({scholarship.student.student_id}) - Class {scholarship.student.class}
                        </p>
                      )}
                      <p><strong>Amount:</strong> {formatCurrency(scholarship.amount)}</p>
                      <p><strong>Applied:</strong> {formatDate(scholarship.application_date)}</p>
                      {scholarship.approved_date && (
                        <p><strong>Approved:</strong> {formatDate(scholarship.approved_date)}</p>
                      )}
                    </div>
                  </div>
                  
                  {scholarship.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleScholarshipAction(scholarship.id, 'approved')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setSelectedScholarship(scholarship)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {scholarship.reason && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Application Reason:</h4>
                    <p className="text-sm text-gray-700">{scholarship.reason}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Fee Modal */}
      {showAddFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Fee Record</h3>
            
            <form onSubmit={handleAddFee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student *
                </label>
                <select
                  value={newFee.student_id}
                  onChange={(e) => setNewFee({...newFee, student_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.student_id}) - Class {student.class}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Type *
                </label>
                <select
                  value={newFee.fee_type}
                  onChange={(e) => setNewFee({...newFee, fee_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Fee Type</option>
                  <option value="Tuition Fee - Q1">Tuition Fee - Q1</option>
                  <option value="Tuition Fee - Q2">Tuition Fee - Q2</option>
                  <option value="Tuition Fee - Q3">Tuition Fee - Q3</option>
                  <option value="Tuition Fee - Q4">Tuition Fee - Q4</option>
                  <option value="Annual Charges">Annual Charges</option>
                  <option value="Exam Fee">Exam Fee</option>
                  <option value="Library Fee">Library Fee</option>
                  <option value="Transport Fee">Transport Fee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={newFee.amount}
                  onChange={(e) => setNewFee({...newFee, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={newFee.due_date}
                  onChange={(e) => setNewFee({...newFee, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Fee Record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFeeModal(false);
                    setNewFee({
                      student_id: '',
                      fee_type: '',
                      amount: '',
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

      {/* Reject Scholarship Modal */}
      {selectedScholarship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Scholarship Application</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Student:</strong> {selectedScholarship.student?.name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Type:</strong> {selectedScholarship.scholarship_type}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Amount:</strong> {formatCurrency(selectedScholarship.amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Provide reason for rejection..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => handleScholarshipAction(selectedScholarship.id, 'rejected')}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => setSelectedScholarship(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFees;