import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Settings as SettingsIcon, User, Lock, Bell, Palette, Save, Eye, EyeOff } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'appearance'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    homeworkReminders: true,
    examNotifications: true,
    feeReminders: true,
    generalAnnouncements: true,
    counselingUpdates: true,
    libraryDueDates: true,
    emailNotifications: false,
    soundEnabled: true
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }

    // In a real app, this would make an API call to update the password
    alert('Password updated successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleNotificationSave = () => {
    // In a real app, this would save to backend
    alert('Notification preferences saved successfully!');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // In a real app, this would apply theme changes
    alert(`Theme changed to ${newTheme}!`);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences and security</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Contact admin to change your name</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      value={user?.student_id || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <input
                      type="text"
                      value={user?.class || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={user?.roll_number || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    To update your contact details or address, please use the "Request Update" option in your Profile page.
                    Basic information like name and student ID can only be changed by contacting the school administration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Update Password
                  </button>
                </form>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Password Security Tips</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use a combination of letters, numbers, and symbols</li>
                  <li>• Don't use personal information like your name or birthday</li>
                  <li>• Make it at least 8 characters long</li>
                  <li>• Don't share your password with anyone</li>
                </ul>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Academic Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'homeworkReminders', label: 'Homework due date reminders' },
                        { key: 'examNotifications', label: 'Exam schedules and updates' },
                        { key: 'feeReminders', label: 'Fee payment reminders' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: e.target.checked
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">General Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'generalAnnouncements', label: 'School announcements and notices' },
                        { key: 'counselingUpdates', label: 'Counseling session updates' },
                        { key: 'libraryDueDates', label: 'Library book due dates' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: e.target.checked
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Delivery Preferences</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'emailNotifications', label: 'Send notifications to email' },
                        { key: 'soundEnabled', label: 'Enable notification sounds' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: e.target.checked
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNotificationSave}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Theme Preferences</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Choose Theme</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light Theme', description: 'Clean and bright interface' },
                        { value: 'dark', label: 'Dark Theme', description: 'Easy on the eyes' },
                        { value: 'system', label: 'System', description: 'Match device settings' }
                      ].map(option => (
                        <div
                          key={option.value}
                          onClick={() => handleThemeChange(option.value as typeof theme)}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            theme === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            <input
                              type="radio"
                              checked={theme === option.value}
                              onChange={() => handleThemeChange(option.value as typeof theme)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-900">{option.label}</span>
                          </div>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
                  <div className="bg-white border border-gray-200 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">Sample Card</h5>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">New</span>
                    </div>
                    <p className="text-sm text-gray-600">This is how your interface will look with the selected theme.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;