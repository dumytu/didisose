import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, Users, BookOpen, TrendingUp, Download, Calendar } from 'lucide-react';

const AdminReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCounselors: 0,
    totalHomework: 0,
    totalNotices: 0,
    totalComplaints: 0,
    totalBooks: 0,
    totalFees: 0,
    totalScholarships: 0
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      // Load all statistics
      const [
        studentsRes,
        counselorsRes,
        homeworkRes,
        noticesRes,
        complaintsRes,
        booksRes,
        feesRes,
        scholarshipsRes
      ] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'student'),
        supabase.from('users').select('*').eq('role', 'counselor'),
        supabase.from('homework').select('*').eq('is_active', true),
        supabase.from('notices').select('*').eq('is_active', true),
        supabase.from('complaints').select('*'),
        supabase.from('books').select('*'),
        supabase.from('fees').select('*'),
        supabase.from('scholarships').select('*')
      ]);

      setStats({
        totalStudents: studentsRes.data?.length || 0,
        totalCounselors: counselorsRes.data?.length || 0,
        totalHomework: homeworkRes.data?.length || 0,
        totalNotices: noticesRes.data?.length || 0,
        totalComplaints: complaintsRes.data?.length || 0,
        totalBooks: booksRes.data?.length || 0,
        totalFees: feesRes.data?.length || 0,
        totalScholarships: scholarshipsRes.data?.length || 0
      });

      // Create recent activity feed
      const activities = [
        ...((studentsRes.data || []).slice(0, 3).map((student: any) => ({
          type: 'student',
          title: 'New Student Registered',
          description: `${student.name} joined the school`,
          date: student.created_at,
          icon: Users,
          color: 'blue'
        }))),
        ...((homeworkRes.data || []).slice(0, 3).map((homework: any) => ({
          type: 'homework',
          title: 'New Homework Assigned',
          description: `${homework.title} for ${homework.subject}`,
          date: homework.created_at,
          icon: BookOpen,
          color: 'green'
        }))),
        ...((complaintsRes.data || []).slice(0, 2).map((complaint: any) => ({
          type: 'complaint',
          title: 'New Complaint Filed',
          description: complaint.title,
          date: complaint.created_at,
          icon: TrendingUp,
          color: 'red'
        })))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadReport = (type: string) => {
    // In a real application, this would generate and download actual reports
    alert(`${type} report download would be implemented here`);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Overview of school activities and performance metrics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Homework</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalHomework}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Complaints</p>
              <p className="text-3xl font-bold text-red-900">{stats.totalComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Library Books</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalBooks}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Students</span>
              <span className="font-medium">{stats.totalStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Counselors</span>
              <span className="font-medium">{stats.totalCounselors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Users</span>
              <span className="font-medium">{stats.totalStudents + stats.totalCounselors + 1}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Homework</span>
              <span className="font-medium">{stats.totalHomework}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Published Notices</span>
              <span className="font-medium">{stats.totalNotices}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Library Books</span>
              <span className="font-medium">{stats.totalBooks}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Services</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Complaints</span>
              <span className="font-medium">{stats.totalComplaints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fee Records</span>
              <span className="font-medium">{stats.totalFees}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Scholarships</span>
              <span className="font-medium">{stats.totalScholarships}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => downloadReport('Student')}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Student Report
            </button>
            <button
              onClick={() => downloadReport('Academic')}
              className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Academic Report
            </button>
            <button
              onClick={() => downloadReport('Financial')}
              className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Financial Report
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
        </div>
        
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.color === 'blue' ? 'bg-blue-100' :
                    activity.color === 'green' ? 'bg-green-100' :
                    activity.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <activity.icon className={`w-5 h-5 ${
                      activity.color === 'blue' ? 'text-blue-600' :
                      activity.color === 'green' ? 'text-green-600' :
                      activity.color === 'red' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Database Performance</span>
                <span className="text-green-600 font-medium">Excellent</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">User Activity</span>
                <span className="text-blue-600 font-medium">High</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Storage Usage</span>
                <span className="text-orange-600 font-medium">Moderate</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">New Students This Month</p>
                <p className="text-xs text-blue-700">Compared to last month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">12</p>
                <p className="text-xs text-green-600">+20%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-900">Homework Completed</p>
                <p className="text-xs text-green-700">Average completion rate</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">87%</p>
                <p className="text-xs text-green-600">+5%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-purple-900">Library Usage</p>
                <p className="text-xs text-purple-700">Books issued this month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-900">156</p>
                <p className="text-xs text-purple-600">+12%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;