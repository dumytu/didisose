import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Bell, 
  BookOpen, 
  GraduationCap, 
  CreditCard, 
  MessageCircle, 
  AlertTriangle, 
  Bot, 
  User, 
  Library, 
  Settings, 
  Users,
  FileText,
  BarChart3,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin, isCounselor, isStudent, isLibrarian } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getNavigationItems = () => {
    if (isStudent) {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Notice Board', href: '/notice-board', icon: Bell },
        { name: 'Homework', href: '/homework', icon: BookOpen },
        { name: 'Results', href: '/results', icon: GraduationCap },
        { name: 'Fee & Scholarships', href: '/fee', icon: CreditCard },
        { name: 'Counseling', href: '/counseling', icon: MessageCircle },
        { name: 'Complaint Box', href: '/complaint-box', icon: AlertTriangle },
        { name: 'Doubt Solver', href: '/chatbot', icon: Bot },
        { name: 'Personal Details', href: '/profile', icon: User },
        { name: 'Library', href: '/library', icon: Library },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];
    } else if (isAdmin) {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
        { name: 'Students', href: '/admin/students', icon: Users },
        { name: 'Counselors', href: '/admin/counselors', icon: MessageCircle },
        { name: 'Homework', href: '/admin/homework', icon: BookOpen },
        { name: 'Results', href: '/admin/results', icon: GraduationCap },
        { name: 'Notices', href: '/admin/notices', icon: Bell },
        { name: 'Complaints', href: '/admin/complaints', icon: AlertTriangle },
        { name: 'Counseling', href: '/admin/counseling', icon: MessageCircle },
        { name: 'Fees', href: '/admin/fees', icon: CreditCard },
        { name: 'Library', href: '/admin/library', icon: Library },
        { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ];
    } else if (isCounselor) {
      return [
        { name: 'Dashboard', href: '/manager-dashboard', icon: Home },
        { name: 'My Students', href: '/counselor/students', icon: Users },
        { name: 'Counseling Requests', href: '/counselor/counseling', icon: MessageCircle },
        { name: 'Complaints', href: '/counselor/complaints', icon: AlertTriangle },
        { name: 'Reports', href: '/counselor/reports', icon: BarChart3 },
        { name: 'Settings', href: '/counselor/settings', icon: Settings },
      ];
    } else if (isLibrarian) {
      return [
        { name: 'Dashboard', href: '/librarian/dashboard', icon: Home },
        { name: 'Books', href: '/librarian/books', icon: BookOpen },
        { name: 'Book Issues', href: '/librarian/issues', icon: FileText },
        { name: 'Students', href: '/librarian/students', icon: Users },
        { name: 'Reports', href: '/librarian/reports', icon: BarChart3 },
        { name: 'Settings', href: '/librarian/settings', icon: Settings },
      ];
    }
    return [];
  };

  const handleNavigation = (href: string) => {
    window.location.href = href;
    setSidebarOpen(false);
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-blue-600 text-white">
          <h2 className="text-lg font-semibold">SOSE Campus</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="w-full flex items-center px-3 py-2 text-left text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-left text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            SOSE Lajpat Nagar - Digital Campus
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;