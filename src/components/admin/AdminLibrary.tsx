import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Library as LibraryIcon, Plus, Search, Edit, Trash2, BookOpen, Users, Clock, CheckCircle } from 'lucide-react';

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
  created_at: string;
}

interface BookIssue {
  id: string;
  book_id: string;
  student_id: string;
  issued_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  status: 'requested' | 'issued' | 'returned' | 'overdue';
  book?: Book;
  student?: {
    name: string;
    student_id: string;
    class: string;
  };
}

const AdminLibrary: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookIssues, setBookIssues] = useState<BookIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'issues'>('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    subject: '',
    total_copies: '1',
    description: '',
    is_digital: false,
    digital_url: ''
  });

  useEffect(() => {
    loadBooks();
    loadBookIssues();
  }, []);

  const loadBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const loadBookIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('book_issues')
        .select(`
          *,
          book:books(*),
          student:users!student_id(name, student_id, class)
        `)
        .order('issued_date', { ascending: false });

      if (error) throw error;
      setBookIssues(data || []);
    } catch (error) {
      console.error('Error loading book issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('books')
        .insert([{
          title: newBook.title,
          author: newBook.author,
          isbn: newBook.isbn || null,
          subject: newBook.subject || null,
          total_copies: parseInt(newBook.total_copies),
          available_copies: parseInt(newBook.total_copies),
          description: newBook.description || null,
          is_digital: newBook.is_digital,
          digital_url: newBook.digital_url || null,
          created_by: '11111111-1111-1111-1111-111111111111' // Admin ID
        }]);

      if (error) throw error;

      await loadBooks();
      setShowAddBookModal(false);
      resetBookForm();
      alert('Book added successfully!');
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book. Please try again.');
    }
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    
    try {
      const { error } = await supabase
        .from('books')
        .update({
          title: newBook.title,
          author: newBook.author,
          isbn: newBook.isbn || null,
          subject: newBook.subject || null,
          total_copies: parseInt(newBook.total_copies),
          description: newBook.description || null,
          is_digital: newBook.is_digital,
          digital_url: newBook.digital_url || null
        })
        .eq('id', editingBook.id);

      if (error) throw error;

      await loadBooks();
      setEditingBook(null);
      resetBookForm();
      alert('Book updated successfully!');
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Failed to update book. Please try again.');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;
      await loadBooks();
      alert('Book deleted successfully!');
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book. Please try again.');
    }
  };

  const handleIssueAction = async (issueId: string, action: 'approve' | 'return') => {
    try {
      const updateData: any = {};
      
      if (action === 'approve') {
        updateData.status = 'issued';
        updateData.issued_by = '11111111-1111-1111-1111-111111111111'; // Admin ID
      } else if (action === 'return') {
        updateData.status = 'returned';
        updateData.return_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('book_issues')
        .update(updateData)
        .eq('id', issueId);

      if (error) throw error;

      // Update book availability if approving or returning
      if (action === 'approve') {
        const issue = bookIssues.find(i => i.id === issueId);
        if (issue) {
          await supabase
            .from('books')
            .update({ available_copies: issue.book!.available_copies - 1 })
            .eq('id', issue.book_id);
        }
      } else if (action === 'return') {
        const issue = bookIssues.find(i => i.id === issueId);
        if (issue) {
          await supabase
            .from('books')
            .update({ available_copies: issue.book!.available_copies + 1 })
            .eq('id', issue.book_id);
        }
      }

      await loadBooks();
      await loadBookIssues();
      alert(`Book ${action === 'approve' ? 'issued' : 'returned'} successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing book:`, error);
      alert(`Failed to ${action} book. Please try again.`);
    }
  };

  const startEdit = (book: Book) => {
    setEditingBook(book);
    setNewBook({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      subject: book.subject || '',
      total_copies: book.total_copies.toString(),
      description: book.description || '',
      is_digital: book.is_digital,
      digital_url: book.digital_url || ''
    });
  };

  const resetBookForm = () => {
    setNewBook({
      title: '',
      author: '',
      isbn: '',
      subject: '',
      total_copies: '1',
      description: '',
      is_digital: false,
      digital_url: ''
    });
  };

  const getFilteredBooks = () => {
    if (!searchTerm) return books;
    
    return books.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredIssues = () => {
    if (!searchTerm) return bookIssues;
    
    return bookIssues.filter(issue =>
      issue.book?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.student?.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
      'overdue': Clock
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

  const getLibraryStats = () => {
    const totalBooks = books.reduce((sum, book) => sum + book.total_copies, 0);
    const availableBooks = books.reduce((sum, book) => sum + book.available_copies, 0);
    const issuedBooks = bookIssues.filter(issue => issue.status === 'issued').length;
    const overdueBooks = bookIssues.filter(issue => issue.status === 'overdue').length;

    return { totalBooks, availableBooks, issuedBooks, overdueBooks };
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>
          <p className="text-gray-600 mt-1">Manage books and track book issues</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('books')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'books'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Books
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'issues'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Book Issues
            </button>
          </div>

          {activeTab === 'books' && (
            <button
              onClick={() => setShowAddBookModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Book
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Books</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <LibraryIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-3xl font-bold text-green-900">{stats.availableBooks}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Issued</p>
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
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={activeTab === 'books' ? "Search books by title, author, subject, or ISBN..." : "Search by book title, student name, or ID..."}
          />
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'books' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredBooks().length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
              <LibraryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No books found</p>
              <button
                onClick={() => setShowAddBookModal(true)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Add your first book
              </button>
            </div>
          ) : (
            getFilteredBooks().map((book) => (
              <div key={book.id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{book.title}</h3>
                    <p className="text-gray-600 text-sm mb-1">by {book.author}</p>
                    {book.subject && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                        {book.subject}
                      </span>
                    )}
                    {book.is_digital && (
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mb-2 ml-1">
                        Digital
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEdit(book)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {book.description && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">{book.description}</p>
                )}

                <div className="space-y-2 text-sm text-gray-600">
                  {book.isbn && (
                    <p><strong>ISBN:</strong> {book.isbn}</p>
                  )}
                  <div className="flex justify-between">
                    <span><strong>Total Copies:</strong> {book.total_copies}</span>
                    <span className={`font-medium ${book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Available: {book.available_copies}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredIssues().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No book issues found</p>
                    </td>
                  </tr>
                ) : (
                  getFilteredIssues().map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{issue.book?.title}</div>
                          <div className="text-sm text-gray-500">by {issue.book?.author}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{issue.student?.name}</div>
                          <div className="text-sm text-gray-500">
                            {issue.student?.student_id} • Class {issue.student?.class}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(issue.issued_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(issue.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(issue.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {issue.status === 'requested' && (
                            <button
                              onClick={() => handleIssueAction(issue.id, 'approve')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                          )}
                          {issue.status === 'issued' && (
                            <button
                              onClick={() => handleIssueAction(issue.id, 'return')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Mark Returned
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Book Modal */}
      {(showAddBookModal || editingBook) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingBook ? 'Edit Book' : 'Add New Book'}
            </h3>
            
            <form onSubmit={editingBook ? handleEditBook : handleAddBook} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author *
                  </label>
                  <input
                    type="text"
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={newBook.subject}
                    onChange={(e) => setNewBook({...newBook, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Copies *
                  </label>
                  <input
                    type="number"
                    value={newBook.total_copies}
                    onChange={(e) => setNewBook({...newBook, total_copies: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_digital"
                    checked={newBook.is_digital}
                    onChange={(e) => setNewBook({...newBook, is_digital: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_digital" className="ml-2 block text-sm text-gray-700">
                    Digital Book
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {newBook.is_digital && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Digital URL
                  </label>
                  <input
                    type="url"
                    value={newBook.digital_url}
                    onChange={(e) => setNewBook({...newBook, digital_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/book.pdf"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingBook ? 'Update Book' : 'Add Book'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBookModal(false);
                    setEditingBook(null);
                    resetBookForm();
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

export default AdminLibrary;