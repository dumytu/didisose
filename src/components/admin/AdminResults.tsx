import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GraduationCap, Plus, Search, Upload, BarChart3, Users } from 'lucide-react';

interface Result {
  id: string;
  student_id: string;
  exam_type: 'class_test' | 'midterm' | 'final';
  subject: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  exam_date: string;
  created_at: string;
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

const AdminResults: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResult, setNewResult] = useState({
    student_id: '',
    exam_type: '',
    subject: '',
    marks_obtained: '',
    total_marks: '',
    exam_date: ''
  });

  useEffect(() => {
    loadResults();
    loadStudents();
  }, []);

  const loadResults = async () => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          student:users!student_id(name, student_id, class)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error loading results:', error);
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

  const calculateGrade = (obtained: number, total: number): string => {
    const percentage = (obtained / total) * 100;
    
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const marksObtained = parseInt(newResult.marks_obtained);
    const totalMarks = parseInt(newResult.total_marks);
    
    if (marksObtained > totalMarks) {
      alert('Marks obtained cannot be greater than total marks!');
      return;
    }

    try {
      const grade = calculateGrade(marksObtained, totalMarks);
      
      const { error } = await supabase
        .from('results')
        .insert([{
          student_id: newResult.student_id,
          exam_type: newResult.exam_type,
          subject: newResult.subject,
          marks_obtained: marksObtained,
          total_marks: totalMarks,
          grade: grade,
          exam_date: newResult.exam_date,
          created_by: '11111111-1111-1111-1111-111111111111' // Admin ID
        }]);

      if (error) throw error;

      await loadResults();
      setShowAddModal(false);
      setNewResult({
        student_id: '',
        exam_type: '',
        subject: '',
        marks_obtained: '',
        total_marks: '',
        exam_date: ''
      });
      alert('Result added successfully!');
    } catch (error) {
      console.error('Error adding result:', error);
      alert('Failed to add result. Please try again.');
    }
  };

  const getFilteredResults = () => {
    let filtered = results;

    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.student?.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(result => result.student?.class === selectedClass);
    }

    if (selectedExamType !== 'all') {
      filtered = filtered.filter(result => result.exam_type === selectedExamType);
    }

    return filtered;
  };

  const getUniqueClasses = () => {
    const classes = results.map(result => result.student?.class).filter(Boolean);
    return [...new Set(classes)].sort();
  };

  const getStats = () => {
    const totalResults = results.length;
    const averagePercentage = results.length > 0 
      ? results.reduce((sum, result) => sum + (result.marks_obtained / result.total_marks) * 100, 0) / results.length
      : 0;
    const uniqueStudents = new Set(results.map(r => r.student_id)).size;
    const uniqueSubjects = new Set(results.map(r => r.subject)).size;

    return { totalResults, averagePercentage, uniqueStudents, uniqueSubjects };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const stats = getStats();

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
          <h1 className="text-2xl font-bold text-gray-900">Results Management</h1>
          <p className="text-gray-600 mt-1">Manage student exam results and grades</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Result
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Results</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalResults}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average %</p>
              <p className="text-3xl font-bold text-green-900">{stats.averagePercentage.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Students</p>
              <p className="text-3xl font-bold text-purple-900">{stats.uniqueStudents}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subjects</p>
              <p className="text-3xl font-bold text-orange-900">{stats.uniqueSubjects}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

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
              placeholder="Search by student name, ID, or subject..."
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
          <select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Exam Types</option>
            <option value="class_test">Class Test</option>
            <option value="midterm">Mid Term</option>
            <option value="final">Final Exam</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
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
              {getFilteredResults().length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No results found</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Add your first result
                    </button>
                  </td>
                </tr>
              ) : (
                getFilteredResults().map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{result.student?.name}</div>
                        <div className="text-sm text-gray-500">
                          {result.student?.student_id} • Class {result.student?.class}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getExamTypeLabel(result.exam_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.marks_obtained}/{result.total_marks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {((result.marks_obtained / result.total_marks) * 100).toFixed(1)}%
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Result Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Result</h3>
            
            <form onSubmit={handleAddResult} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student *
                </label>
                <select
                  value={newResult.student_id}
                  onChange={(e) => setNewResult({...newResult, student_id: e.target.value})}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={newResult.subject}
                    onChange={(e) => setNewResult({...newResult, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Social Science">Social Science</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Type *
                  </label>
                  <select
                    value={newResult.exam_type}
                    onChange={(e) => setNewResult({...newResult, exam_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Exam Type</option>
                    <option value="class_test">Class Test</option>
                    <option value="midterm">Mid Term</option>
                    <option value="final">Final Exam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks Obtained *
                  </label>
                  <input
                    type="number"
                    value={newResult.marks_obtained}
                    onChange={(e) => setNewResult({...newResult, marks_obtained: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    value={newResult.total_marks}
                    onChange={(e) => setNewResult({...newResult, total_marks: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Date *
                </label>
                <input
                  type="date"
                  value={newResult.exam_date}
                  onChange={(e) => setNewResult({...newResult, exam_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {newResult.marks_obtained && newResult.total_marks && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Preview:</strong> {' '}
                    Percentage: {((parseInt(newResult.marks_obtained) / parseInt(newResult.total_marks)) * 100).toFixed(1)}% • {' '}
                    Grade: <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(calculateGrade(parseInt(newResult.marks_obtained), parseInt(newResult.total_marks)))}`}>
                      {calculateGrade(parseInt(newResult.marks_obtained), parseInt(newResult.total_marks))}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Add Result
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewResult({
                      student_id: '',
                      exam_type: '',
                      subject: '',
                      marks_obtained: '',
                      total_marks: '',
                      exam_date: ''
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
    </div>
  );
};

export default AdminResults;