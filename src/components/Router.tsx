import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';
import Layout from './Layout';
import Dashboard from './Dashboard';
import NoticeBoard from './student/NoticeBoard';
import Homework from './student/Homework';
import Results from './student/Results';
import FeeScholarship from './student/FeeScholarship';
import Counseling from './student/Counseling';
import ComplaintBox from './student/ComplaintBox';
import Chatbot from './student/Chatbot';
import Profile from './student/Profile';
import Library from './student/Library';
import Settings from './student/Settings';

// Admin components
import AdminStudents from './admin/AdminStudents';
import AdminCounselors from './admin/AdminCounselors';
import AdminHomework from './admin/AdminHomework';
import AdminResults from './admin/AdminResults';
import AdminNotices from './admin/AdminNotices';
import AdminComplaints from './admin/AdminComplaints';
import AdminCounseling from './admin/AdminCounseling';
import AdminFees from './admin/AdminFees';
import AdminLibrary from './admin/AdminLibrary';
import AdminReports from './admin/AdminReports';
import AdminSettings from './admin/AdminSettings';

// Counselor components
import CounselorDashboard from './counselor/CounselorDashboard';

// Librarian components  
import LibrarianDashboard from './librarian/LibrarianDashboard';

const Router: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const currentPath = window.location.pathname;

  const renderRoute = () => {
    // Student routes
    if (user.role === 'student') {
      switch (currentPath) {
        case '/dashboard':
          return <Dashboard />;
        case '/notice-board':
          return <NoticeBoard />;
        case '/homework':
          return <Homework />;
        case '/results':
          return <Results />;
        case '/fee':
          return <FeeScholarship />;
        case '/counseling':
          return <Counseling />;
        case '/complaint-box':
          return <ComplaintBox />;
        case '/chatbot':
          return <Chatbot />;
        case '/profile':
          return <Profile />;
        case '/library':
          return <Library />;
        case '/settings':
          return <Settings />;
        default:
          return <Dashboard />;
      }
    }

    // Admin routes
    if (user.role === 'admin') {
      switch (currentPath) {
        case '/admin/dashboard':
          return <Dashboard />;
        case '/admin/students':
          return <AdminStudents />;
        case '/admin/counselors':
          return <AdminCounselors />;
        case '/admin/homework':
          return <AdminHomework />;
        case '/admin/results':
          return <AdminResults />;
        case '/admin/notices':
          return <AdminNotices />;
        case '/admin/complaints':
          return <AdminComplaints />;
        case '/admin/counseling':
          return <AdminCounseling />;
        case '/admin/fees':
          return <AdminFees />;
        case '/admin/library':
          return <AdminLibrary />;
        case '/admin/reports':
          return <AdminReports />;
        case '/admin/settings':
          return <AdminSettings />;
        default:
          window.location.href = '/admin/dashboard';
          return <Dashboard />;
      }
    }

    // Counselor routes
    if (user.role === 'counselor') {
      switch (currentPath) {
        case '/manager-dashboard':
          return <CounselorDashboard />;
        default:
          return <CounselorDashboard />;
      }
    }

    // Librarian routes
    if (user.role === 'librarian') {
      switch (currentPath) {
        case '/librarian/dashboard':
          return <LibrarianDashboard />;
        default:
          return <LibrarianDashboard />;
      }
    }

    return <Dashboard />;
  };

  return (
    <Layout>
      {renderRoute()}
    </Layout>
  );
};

export default Router;