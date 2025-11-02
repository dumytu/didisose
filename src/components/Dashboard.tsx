import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, 
  Bell, 
  CreditCard, 
  MessageCircle, 
  Bot,
  TrendingUp,
  Calendar,
  Award,
  Users,
  AlertTriangle,
  Library,
  FileText
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isStudent, isAdmin, isCounselor, isLibrarian } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [pendingHomework, setPendingHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      if (isStudent) {
        // Load student dashboard data
        const [noticesRes, homeworkRes, feesRes, resultsRes] = await Promise.all([
          supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(3),
          supabase.from('homework').select('*').eq('class', user?.class).order('due_date', { ascending: true }).limit(5),
          supabase.from('fees').select('*').eq('student_id', user?.id).eq('payment_status', 'pending'),
          supabase.from('results').select('*').eq('student_id', user?.id).order('created_at', { ascending: false }).limit(1)
        ]);

        setRecentNotices(noticesRes.data || []);
        setPendingHomework(homeworkRes.data || []);
        
        const pendingFees = feesRes.data?.reduce((sum, fee) => sum + parseFloat(fee.amount), 0) || 0;
        const avgMarks = resultsRes.data?.[0]?.marks_obtained || 0;

        setStats({
          pendingHomework: homeworkRes.data?.length || 0,
          pendingFees,
          averageMarks: avgMarks,
          totalNotices: noticesRes.data?.length || 0
        });
      } else if (isAdmin) {
        // Load admin dashboard data
        const [studentsRes, counselorsRes, complaintsRes, homeworkRes] = await Promise.all([
          supabase.from('users').select('*').eq('role', 'student'),
          supabase.from('users').select('*').eq('role', 'counselor'),
          supabase.from('complaints').select('*').eq('status', 'pending'),
          supabase.from('homework').select('*')
        ]);

        setStats({
          totalStudents: studentsRes.data?.length || 0,
          totalCounselors: counselorsRes.data?.length || 0,
          pendingComplaints: complaintsRes.data?.length || 0,
          totalHomework: homeworkRes.data?.length || 0
        });
      } else if (isCounselor) {
        // Load counselor dashboard data
        const [requestsRes, complaintsRes] = await Promise.all([
          supabase.from('counseling_requests').select('*').eq('counselor_id', user?.id),
          supabase.from('complaints').select('*').eq('status', 'in_progress')
        ]);

        setStats({
          totalRequests: requestsRes.data?.length || 0,
          activeComplaints: complaintsRes.data?.length || 0,
          completedSessions: requestsRes.data?.filter(r => r.status === 'completed').length || 0
        });
      } else if (isLibrarian) {
        // Load librarian dashboard data
        const [booksRes, issuesRes] = await Promise.all([
          supabase.from('books').select('*'),
          supabase.from('book_issues').select('*').eq('status', 'issued')
        ]);

        setStats({
          totalBooks: booksRes.data?.length || 0,
          issuedBooks: issuesRes.data?.length || 0,
          availableBooks: booksRes.data?.reduce((sum, book) => sum + book.available_copies, 0) || 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    return `${greeting}, ${user?.name}!`;
  };

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">{getWelcomeMessage()}</h1>
        <p className="text-blue-100 mt-2">Class {user?.class} • Roll No. {user?.roll_number}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Homework</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingHomework}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Fees</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.pendingFees}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Latest Marks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageMarks}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Notices</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalNotices}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notices</h3>
          <div className="space-y-4">
            {recentNotices.map((notice) => (
              <div key={notice.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{notice.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notice.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Homework</h3>
          <div className="space-y-4">
            {pendingHomework.map((homework) => (
              <div key={homework.id} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <BookOpen className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">{homework.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{homework.subject}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Due: {new Date(homework.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => window.location.href = '/counseling'}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow text-center"
        >
          <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Counseling</p>
        </button>
        
        <button 
          onClick={() => window.location.href = '/chatbot'}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow text-center"
        >
          <Bot className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Doubt Solver</p>
        </button>

        <button 
          onClick={() => window.location.href = '/library'}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow text-center"
        >
          <Library className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Library</p>
        </button>

        <button 
          onClick={() => window.location.href = '/complaint-box'}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow text-center"
        >
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Complaints</p>
        </button>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">{getWelcomeMessage()}</h1>
        <p className="text-purple-100 mt-2">Administrator Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Counselors</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCounselors}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Homework</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalHomework}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => window.location.href = '/admin/students'}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow text-center"
        >
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Manage Students</p>
        </button>
        
        <button 
          onClick={() => window.location.href = '/admin/complaints'}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow text-center"
        >
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Handle Complaints</p>
        </button>

        <button 
          onClick={() => window.location.href = '/admin/notices'}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow text-center"
        >
          <Bell className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Manage Notices</p>
        </button>

        <button 
          onClick={() => window.location.href = '/admin/library'}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow text-center"
        >
          <Library className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Library System</p>
        </button>
      </div>
    </div>
  );

  const renderCounselorDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">{getWelcomeMessage()}</h1>
        <p className="text-green-100 mt-2">Counselor Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Counseling Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedSessions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLibrarianDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">{getWelcomeMessage()}</h1>
        <p className="text-indigo-100 mt-2">Library Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Books</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Issued Books</p>
              <p className="text-3xl font-bold text-gray-900">{stats.issuedBooks}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Copies</p>
              <p className="text-3xl font-bold text-gray-900">{stats.availableBooks}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Library className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {isStudent && renderStudentDashboard()}
      {isAdmin && renderAdminDashboard()}
      {isCounselor && renderCounselorDashboard()}
      {isLibrarian && renderLibrarianDashboard()}
    </div>
  );
};

export default Dashboard;