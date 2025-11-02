import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Calendar, Upload, CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  attachment_url?: string;
  created_at: string;
}

interface Submission {
  id: string;
  homework_id: string;
  submission_text?: string;
  attachment_url?: string;
  submitted_at: string;
  marks?: number;
  remarks?: string;
}

const Homework: React.FC = () => {
  const { user } = useAuth();
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHomework();
    loadSubmissions();
  }, [user]);

  const loadHomework = async () => {
    if (!user?.class) return;

    try {
      const { data, error } = await supabase
        .from('homework')
        .select('*')
        .eq('class', user.class)
        .eq('is_active', true)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setHomework(data || []);
    } catch (error) {
      console.error('Error loading homework:', error);
    }
  };

  const loadSubmissions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionForHomework = (homeworkId: string) => {
    return submissions.find(sub => sub.homework_id === homeworkId);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomework || !submissionText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('homework_submissions')
        .insert([{
          homework_id: selectedHomework.id,
          student_id: user?.id,
          submission_text: submissionText,
          submitted_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await loadSubmissions();
      setSelectedHomework(null);
      setSubmissionText('');
      alert('Homework submitted successfully!');
    } catch (error) {
      console.error('Error submitting homework:', error);
      alert('Failed to submit homework. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (homeworkItem: HomeworkItem) => {
    const submission = getSubmissionForHomework(homeworkItem.id);
    
    if (submission) {
      if (submission.marks !== null && submission.marks !== undefined) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Graded ({submission.marks}/100)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Submitted
        </span>
      );
    }

    if (isOverdue(homeworkItem.due_date)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Mathematics': 'bg-blue-100 text-blue-800',
      'Physics': 'bg-purple-100 text-purple-800',
      'Chemistry': 'bg-green-100 text-green-800',
      'Biology': 'bg-teal-100 text-teal-800',
      'English': 'bg-red-100 text-red-800',
      'Hindi': 'bg-orange-100 text-orange-800',
      'Social Science': 'bg-indigo-100 text-indigo-800',
    };
    return colors[subject] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
        <p className="text-gray-600 mt-1">View and submit your assignments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Homework List */}
        <div className="lg:col-span-2 space-y-4">
          {homework.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No homework assigned</p>
              <p className="text-gray-400 text-sm">Check back later for new assignments</p>
            </div>
          ) : (
            homework.map((item) => {
              const submission = getSubmissionForHomework(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSubjectColor(item.subject)}`}>
                          {item.subject}
                        </span>
                        {getStatusBadge(item)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-700 text-sm mb-3 line-clamp-3">{item.description}</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due: {formatDate(item.due_date)}
                        {isOverdue(item.due_date) && !submission && (
                          <span className="ml-2 text-red-600 font-medium">• Overdue</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {submission && submission.remarks && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Teacher's Remarks:</h4>
                      <p className="text-sm text-blue-800">{submission.remarks}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      {item.attachment_url && (
                        <a
                          href={item.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Assignment
                        </a>
                      )}
                      {submission?.attachment_url && (
                        <a
                          href={submission.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          My Submission
                        </a>
                      )}
                    </div>
                    {!submission && !isOverdue(item.due_date) && (
                      <button
                        onClick={() => setSelectedHomework(item)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Submission Form */}
        {selectedHomework && (
          <div className="bg-white rounded-xl p-6 shadow-sm border h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Homework</h3>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">{selectedHomework.title}</h4>
              <p className="text-sm text-gray-600">{selectedHomework.subject}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Write your answer here..."
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit Homework'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHomework(null);
                    setSubmissionText('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Stats */}
        {!selectedHomework && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Assigned</span>
                  <span className="font-medium">{homework.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted</span>
                  <span className="font-medium text-green-600">
                    {submissions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium text-orange-600">
                    {homework.length - submissions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overdue</span>
                  <span className="font-medium text-red-600">
                    {homework.filter(item => 
                      isOverdue(item.due_date) && !getSubmissionForHomework(item.id)
                    ).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homework;