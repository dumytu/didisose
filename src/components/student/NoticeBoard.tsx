import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Clock, Filter, AlertCircle, BookOpen, GraduationCap } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'urgent' | 'class' | 'exam';
  target_class?: string;
  created_at: string;
  attachment_url?: string;
}

const NoticeBoard: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    loadNotices();
  }, []);

  useEffect(() => {
    filterNotices();
  }, [notices, selectedFilter, user]);

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error loading notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotices = () => {
    let filtered = notices;

    if (selectedFilter === 'class') {
      filtered = notices.filter(notice => 
        notice.target_class === user?.class || notice.target_class === null
      );
    } else if (selectedFilter !== 'all') {
      filtered = notices.filter(notice => notice.category === selectedFilter);
    }

    setFilteredNotices(filtered);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'exam':
        return <GraduationCap className="w-5 h-5 text-purple-600" />;
      case 'class':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      exam: 'bg-purple-100 text-purple-800 border-purple-200',
      class: 'bg-blue-100 text-blue-800 border-blue-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[category as keyof typeof styles]}`}>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notice Board</h1>
          <p className="text-gray-600 mt-1">Stay updated with latest school announcements</p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Notices</option>
            <option value="urgent">Urgent</option>
            <option value="exam">Exam Related</option>
            <option value="class">Class Specific</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notices found</p>
            <p className="text-gray-400 text-sm">Check back later for updates</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white rounded-xl p-6 shadow-sm border-l-4 hover:shadow-md transition-shadow ${
                notice.category === 'urgent' 
                  ? 'border-l-red-500' 
                  : notice.category === 'exam'
                  ? 'border-l-purple-500'
                  : notice.category === 'class'
                  ? 'border-l-blue-500'
                  : 'border-l-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(notice.category)}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{notice.title}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      {getCategoryBadge(notice.category)}
                      {notice.target_class && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Class {notice.target_class}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDate(notice.created_at)}
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="whitespace-pre-line">{notice.content}</p>
              </div>

              {notice.attachment_url && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={notice.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoticeBoard;