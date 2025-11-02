import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Library as LibraryIcon, BookOpen, Search, Calendar, Clock, CheckCircle, AlertTriangle, Download } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  subject?: string;
  total_copies: number;
  available_copies: number;
  description?: string;
  is_digital: boolean;
  digital_url?: string;
}

interface BookIssue {
  id: string;
  book_id: string;
  issued_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  status: 'requested' | 'issued' | 'returned' | 'overdue';
  book?: Book;
}

const Library: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [myIssues, setMyIssues] = useState<BookIssue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-books' | 'digital'>('browse');

  useEffect(() => {
    loadBooks();
    loadMyIssues();
  }, [user]);

  const loadBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const loadMyIssues = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('book_issues')
        .select(`
          *,
          book:books(*)
        `)
        .eq('student_id', user.id)
        .order('issued_date', { ascending: false });

      if (error) throw error;
      setMyIssues(data || []);
    } catch (error) {
      console.error('Error loading book issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBook = async (bookId: string) => {
    if (!user?.id) return;

    // Check if already requested or issued
    const existingIssue = myIssues.find(
      issue => issue.book_id === bookId && ['requested', 'issued'].includes(issue.status)
    );

    if (existingIssue) {
      alert('You have already requested or issued this book.');
      return;
    }

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks from now

      const { error } = await supabase
        .from('book_issues')
        .insert([{
          book_id: bookId,
          student_id: user.id,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'requested'
        }]);

      if (error) throw error;

      await loadMyIssues();
      alert('Book request submitted successfully! Please wait for librarian approval.');
    } catch (error) {
      console.error('Error requesting book:', error);
      alert('Failed to request book. Please try again.');
    }
  };

  const getFilteredBooks = () => {
    let filtered = books;

    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(book => book.subject === selectedCategory);
    }

    return filtered;
  };

  const getDigitalBooks = () => {
    return books.filter(book => book.is_digital);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'requested': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'issued': 'bg-blue-100 text-blue-800 border-blue-200',
      'returned': 'bg-green-100 text-green-800 border-green-200',
      'overdue': 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      'requested': Clock,
      'issued': BookOpen,
      'returned': CheckCircle,
      'overdue': AlertTriangle
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateFine = (dueDate: string, returnDate?: string) => {
    const due = new Date(dueDate);
    const returned = returnDate ? new Date(returnDate) : new Date();
    
    if (returned <= due) return 0;
    
    const daysOverdue = Math.ceil((returned.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return daysOverdue * 2; // ₹2 per day
  };

  const getUniqueSubjects = () => {
    const subjects = books.map(book => book.subject).filter(Boolean);
    return [...new Set(subjects)];
  };

  const getLibraryStats = () => {
    const issuedBooks = myIssues.filter(issue => issue.status === 'issued').length;
    const overdueBooks = myIssues.filter(issue => issue.status === 'overdue').length;
    const totalFine = myIssues.reduce((sum, issue) => sum + (issue.fine_amount || 0), 0);

    return { issuedBooks, overdueBooks, totalFine };
  };

  const stats = getLibraryStats();

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
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="text-gray-600 mt-1">Browse books, manage your issues, and access digital resources</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { id: 'browse', label: 'Browse Books', icon: Search },
            { id: 'my-books', label: 'My Books', icon: BookOpen },
            { id: 'digital', label: 'Digital Library', icon: Download }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Books</p>
              <p className="text-3xl font-bold text-gray-900">{books.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <LibraryIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Books Issued</p>
              <p className="text-3xl font-bold text-blue-900">{stats.issuedBooks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-3xl font-bold text-red-900">{stats.overdueBooks}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Fine</p>
              <p className="text-3xl font-bold text-orange-900">₹{stats.totalFine}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search books by title, author, or subject..."
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {getUniqueSubjects().map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredBooks().map((book) => (
              <div key={book.id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{book.title}</h3>
                  <p className="text-gray-600 text-sm mb-1">by {book.author}</p>
                  {book.subject && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {book.subject}
                    </span>
                  )}
                </div>

                {book.description && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">{book.description}</p>
                )}

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">
                    <span className={`${book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {book.available_copies} available
                    </span>
                    <span className="text-gray-400"> / {book.total_copies} total</span>
                  </div>
                  {book.isbn && (
                    <div className="text-xs text-gray-500">
                      ISBN: {book.isbn}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRequestBook(book.id)}
                  disabled={book.available_copies === 0}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {book.available_copies === 0 ? 'Not Available' : 'Request Book'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'my-books' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">My Book Issues</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fine
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myIssues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No books issued</p>
                      <p className="text-gray-400 text-sm">Request books from the browse section</p>
                    </td>
                  </tr>
                ) : (
                  myIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {issue.book?.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            by {issue.book?.author}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(issue.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(issue.issued_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(issue.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issue.fine_amount > 0 ? (
                          <span className="text-red-600 font-medium">₹{issue.fine_amount}</span>
                        ) : (
                          <span className="text-green-600">₹0</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'digital' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Library</h3>
            <p className="text-gray-600 mb-6">Access digital books and resources instantly</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getDigitalBooks().map((book) => (
                <div key={book.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{book.title}</h4>
                    <p className="text-gray-600 text-sm mb-1">by {book.author}</p>
                    {book.subject && (
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        {book.subject}
                      </span>
                    )}
                  </div>

                  {book.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">{book.description}</p>
                  )}

                  {book.digital_url ? (
                    <a
                      href={book.digital_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Access Digital Copy
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed text-sm font-medium"
                    >
                      Not Available
                    </button>
                  )}
                </div>
              ))}
            </div>

            {getDigitalBooks().length === 0 && (
              <div className="text-center py-12">
                <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No digital books available</p>
                <p className="text-gray-400 text-sm">Digital resources will appear here when added</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;