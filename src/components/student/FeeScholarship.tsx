import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Gift, Calendar, CheckCircle, Clock, AlertTriangle, Plus, Receipt } from 'lucide-react';

interface Fee {
  id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  payment_date?: string;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  created_at: string;
}

interface Scholarship {
  id: string;
  scholarship_type: string;
  amount: number;
  application_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  approved_date?: string;
}

const FeeScholarship: React.FC = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScholarshipForm, setShowScholarshipForm] = useState(false);
  const [newScholarship, setNewScholarship] = useState({
    type: '',
    amount: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFees();
    loadScholarships();
  }, [user]);

  const loadFees = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setFees(data || []);
    } catch (error) {
      console.error('Error loading fees:', error);
    }
  };

  const loadScholarships = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*')
        .eq('student_id', user.id)
        .order('application_date', { ascending: false });

      if (error) throw error;
      setScholarships(data || []);
    } catch (error) {
      console.error('Error loading scholarships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScholarshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScholarship.type || !newScholarship.amount || !newScholarship.reason) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('scholarships')
        .insert([{
          student_id: user?.id,
          scholarship_type: newScholarship.type,
          amount: parseFloat(newScholarship.amount),
          reason: newScholarship.reason,
          application_date: new Date().toISOString().split('T')[0],
          status: 'pending'
        }]);

      if (error) throw error;

      await loadScholarships();
      setShowScholarshipForm(false);
      setNewScholarship({ type: '', amount: '', reason: '' });
      alert('Scholarship application submitted successfully!');
    } catch (error) {
      console.error('Error submitting scholarship:', error);
      alert('Failed to submit scholarship application. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
        'overdue': AlertTriangle
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
        'rejected': AlertTriangle
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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getTotalStats = () => {
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidFees = fees.reduce((sum, fee) => sum + fee.paid_amount, 0);
    const pendingFees = totalFees - paidFees;
    const approvedScholarships = scholarships
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.amount, 0);

    return { totalFees, paidFees, pendingFees, approvedScholarships };
  };

  const stats = getTotalStats();

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
          <h1 className="text-2xl font-bold text-gray-900">Fee & Scholarships</h1>
          <p className="text-gray-600 mt-1">Manage your fee payments and scholarship applications</p>
        </div>

        <button
          onClick={() => setShowScholarshipForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Apply for Scholarship
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalFees)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidFees)}</p>
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
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.pendingFees)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scholarships</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.approvedScholarships)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Records */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Fee Records
            </h3>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {fees.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No fee records found</p>
              </div>
            ) : (
              fees.map((fee) => (
                <div key={fee.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{fee.fee_type}</h4>
                    {getStatusBadge(fee.payment_status, 'fee')}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">{formatCurrency(fee.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid:</span>
                      <span className="font-medium text-green-600">{formatCurrency(fee.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span className="font-medium">{formatDate(fee.due_date)}</span>
                    </div>
                    {fee.payment_date && (
                      <div className="flex justify-between">
                        <span>Paid On:</span>
                        <span className="font-medium">{formatDate(fee.payment_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scholarship Applications */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Gift className="w-5 h-5 mr-2" />
              Scholarship Applications
            </h3>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {scholarships.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No scholarship applications</p>
                <button
                  onClick={() => setShowScholarshipForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Apply for your first scholarship
                </button>
              </div>
            ) : (
              scholarships.map((scholarship) => (
                <div key={scholarship.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{scholarship.scholarship_type}</h4>
                    {getStatusBadge(scholarship.status, 'scholarship')}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">{formatCurrency(scholarship.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Applied On:</span>
                      <span className="font-medium">{formatDate(scholarship.application_date)}</span>
                    </div>
                    {scholarship.approved_date && (
                      <div className="flex justify-between">
                        <span>Approved On:</span>
                        <span className="font-medium text-green-600">{formatDate(scholarship.approved_date)}</span>
                      </div>
                    )}
                    {scholarship.reason && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Reason: {scholarship.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Scholarship Application Form */}
      {showScholarshipForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for Scholarship</h3>
            
            <form onSubmit={handleScholarshipSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scholarship Type
                </label>
                <select
                  value={newScholarship.type}
                  onChange={(e) => setNewScholarship({...newScholarship, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Merit Scholarship">Merit Scholarship</option>
                  <option value="Need-based Scholarship">Need-based Scholarship</option>
                  <option value="Sports Scholarship">Sports Scholarship</option>
                  <option value="Minority Scholarship">Minority Scholarship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={newScholarship.amount}
                  onChange={(e) => setNewScholarship({...newScholarship, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Application
                </label>
                <textarea
                  value={newScholarship.reason}
                  onChange={(e) => setNewScholarship({...newScholarship, reason: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Please explain why you need this scholarship..."
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScholarshipForm(false);
                    setNewScholarship({ type: '', amount: '', reason: '' });
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

export default FeeScholarship;