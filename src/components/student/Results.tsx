import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, TrendingUp, Award, BarChart3, Download } from 'lucide-react';

interface Result {
  id: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  exam_type: 'class_test' | 'midterm' | 'final';
  exam_date: string;
  created_at: string;
}

const Results: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamType, setSelectedExamType] = useState<string>('all');

  useEffect(() => {
    loadResults();
  }, [user]);

  const loadResults = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', user.id)
        .order('exam_date', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredResults = () => {
    if (selectedExamType === 'all') return results;
    return results.filter(result => result.exam_type === selectedExamType);
  };

  const calculateStats = () => {
    const filteredResults = getFilteredResults();
    if (filteredResults.length === 0) return null;

    const totalMarks = filteredResults.reduce((sum, result) => sum + result.marks_obtained, 0);
    const totalPossible = filteredResults.reduce((sum, result) => sum + result.total_marks, 0);
    const percentage = (totalMarks / totalPossible) * 100;

    const subjectWise = filteredResults.reduce((acc, result) => {
      if (!acc[result.subject]) {
        acc[result.subject] = { total: 0, obtained: 0, count: 0 };
      }
      acc[result.subject].total += result.total_marks;
      acc[result.subject].obtained += result.marks_obtained;
      acc[result.subject].count += 1;
      return acc;
    }, {} as Record<string, { total: number; obtained: number; count: number }>);

    return {
      overallPercentage: percentage,
      totalSubjects: Object.keys(subjectWise).length,
      subjectWise,
      highestScore: Math.max(...filteredResults.map(r => (r.marks_obtained / r.total_marks) * 100)),
      averageScore: percentage
    };
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-blue-100 text-blue-800',
      'B+': 'bg-indigo-100 text-indigo-800',
      'B': 'bg-purple-100 text-purple-800',
      'C+': 'bg-orange-100 text-orange-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-red-100 text-red-800',
      'F': 'bg-red-200 text-red-900'
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'class_test': 'Class Test',
      'midterm': 'Mid Term',
      'final': 'Final Exam'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadReportCard = () => {
    // In a real application, this would generate and download a PDF
    alert('Report card download feature would be implemented here');
  };

  const stats = calculateStats();

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
          <h1 className="text-2xl font-bold text-gray-900">Results</h1>
          <p className="text-gray-600 mt-1">View your academic performance and grades</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Exams</option>
            <option value="class_test">Class Tests</option>
            <option value="midterm">Mid Terms</option>
            <option value="final">Final Exams</option>
          </select>
          <button
            onClick={downloadReportCard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            Download Report
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Percentage</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overallPercentage.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subjects</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSubjects}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Highest Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.highestScore.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No results available</p>
          <p className="text-gray-400 text-sm">Results will appear here once exams are graded</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Results Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredResults().map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{result.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{getExamTypeLabel(result.exam_type)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {result.marks_obtained}/{result.total_marks}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {((result.marks_obtained / result.total_marks) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(result.exam_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;