import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User, Edit3, Calendar, MapPin, Phone, Mail, Save, X, Clock } from 'lucide-react';

interface PersonalDetailRequest {
  id: string;
  field_name: string;
  current_value: string;
  requested_value: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  requested_at: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    contact_number: user?.contact_number || '',
    address: user?.address || '',
    parent_contact: user?.parent_contact || ''
  });
  const [pendingRequests, setPendingRequests] = useState<PersonalDetailRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingRequests();
  }, [user]);

  const loadPendingRequests = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('personal_detail_requests')
        .select('*')
        .eq('student_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const handleSubmitChanges = async () => {
    if (!user?.id) return;

    setSubmitting(true);
    try {
      const changes = [];

      // Check for contact number change
      if (editedData.contact_number !== user.contact_number) {
        changes.push({
          student_id: user.id,
          field_name: 'contact_number',
          current_value: user.contact_number || '',
          requested_value: editedData.contact_number,
          status: 'pending',
          requested_at: new Date().toISOString()
        });
      }

      // Check for address change
      if (editedData.address !== user.address) {
        changes.push({
          student_id: user.id,
          field_name: 'address',
          current_value: user.address || '',
          requested_value: editedData.address,
          status: 'pending',
          requested_at: new Date().toISOString()
        });
      }

      // Check for parent contact change
      if (editedData.parent_contact !== user.parent_contact) {
        changes.push({
          student_id: user.id,
          field_name: 'parent_contact',
          current_value: user.parent_contact || '',
          requested_value: editedData.parent_contact,
          status: 'pending',
          requested_at: new Date().toISOString()
        });
      }

      if (changes.length === 0) {
        alert('No changes detected.');
        setEditMode(false);
        return;
      }

      const { error } = await supabase
        .from('personal_detail_requests')
        .insert(changes);

      if (error) throw error;

      await loadPendingRequests();
      setEditMode(false);
      alert('Update requests submitted successfully! Admin will review your changes.');
    } catch (error) {
      console.error('Error submitting changes:', error);
      alert('Failed to submit changes. Please try again.');
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

  const formatDateOfBirth = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      'pending': Clock,
      'approved': Save,
      'rejected': X
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getFieldDisplayName = (fieldName: string) => {
    const names: Record<string, string> = {
      'contact_number': 'Contact Number',
      'address': 'Address',
      'parent_contact': 'Parent Contact'
    };
    return names[fieldName] || fieldName;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal Details</h1>
          <p className="text-gray-600 mt-1">View and request updates to your profile information</p>
        </div>

        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Request Update
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">Student ID: {user?.student_id}</p>
              <p className="text-gray-600">Class {user?.class} • Roll No. {user?.roll_number}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium text-gray-900">{formatDateOfBirth(user?.date_of_birth)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Contact Number</p>
                {editMode ? (
                  <input
                    type="tel"
                    value={editedData.contact_number}
                    onChange={(e) => setEditedData({...editedData, contact_number: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter contact number"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.contact_number || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Address</p>
                {editMode ? (
                  <textarea
                    value={editedData.address}
                    onChange={(e) => setEditedData({...editedData, address: e.target.value})}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter address"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.address || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Parent Contact</p>
                {editMode ? (
                  <input
                    type="tel"
                    value={editedData.parent_contact}
                    onChange={(e) => setEditedData({...editedData, parent_contact: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter parent contact number"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.parent_contact || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {editMode && (
            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSubmitChanges}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Submit Request
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditedData({
                    contact_number: user?.contact_number || '',
                    address: user?.address || '',
                    parent_contact: user?.parent_contact || ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Update Requests */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Update Requests</h3>
            <p className="text-sm text-gray-600 mt-1">Track your profile update requests</p>
          </div>
          
          <div className="p-6 max-h-96 overflow-y-auto">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No update requests</p>
                <p className="text-gray-400 text-sm">Your requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">
                        {getFieldDisplayName(request.field_name)}
                      </h4>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Current:</span>
                        <span className="ml-2 text-gray-900">
                          {request.current_value || 'Not set'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Requested:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {request.requested_value}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                        Requested on {formatDate(request.requested_at)}
                      </div>
                      
                      {request.reason && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-700">
                            <strong>Admin Note:</strong> {request.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Update Process</h4>
            <p className="text-sm text-blue-800 mt-1">
              All profile updates require admin approval for security reasons. You'll be notified once your request is reviewed. 
              Some information like Student ID, Name, and Date of Birth can only be updated by visiting the school office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;