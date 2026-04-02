import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User, Mail, CreditCard, Phone, BookOpen, GraduationCap } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, authUser, updateAuthUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    admissionNumber: '',
    phone: '',
    course: '',
    specialization: '',
    cgpa: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && authUser?.token) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      setError('');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/user/profile`, {
        headers: { Authorization: `Bearer ${authUser.token}` }
      });
      const data = res.data;
      setFormData({
        name: data.name || '',
        email: data.email || '',
        admissionNumber: data.admissionNumber || '',
        phone: data.phone || '',
        course: data.course || '',
        specialization: data.specialization || '',
        cgpa: data.cgpa || ''
      });
      setFetching(false);
    } catch (err) {
      setError('Failed to load profile data');
      setFetching(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const payload = {
        name: formData.name,
        phone: formData.phone
      };
      
      if (authUser?.role === 'student') {
        payload.course = formData.course;
        payload.specialization = formData.specialization;
        payload.cgpa = Number(formData.cgpa) || 0;
      }

      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/user/profile`, payload, {
        headers: { Authorization: `Bearer ${authUser.token}` }
      });
      
      setSuccess('Profile updated successfully!');
      
      // Sync global context so the navbar badge updates instantly without reload
      if (updateAuthUser) {
        updateAuthUser({ ...authUser, name: res.data.name });
      }
      
      setLoading(false);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data || 'Failed to update profile');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
        <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Profile Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition hover:cursor-pointer p-1 rounded hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {fetching ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-pulse flex space-x-2 items-center">
                <div className="h-4 w-4 bg-blue-400 rounded-full"></div>
                <div className="h-4 w-4 bg-blue-400 rounded-full"></div>
                <div className="h-4 w-4 bg-blue-400 rounded-full"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Read Only Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={16} className="text-gray-400" /></div>
                    <input type="text" value={formData.email} disabled className="pl-9 w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg py-2 text-sm cursor-not-allowed" />
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admission Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CreditCard size={16} className="text-gray-400" /></div>
                    <input type="text" value={formData.admissionNumber} disabled className="pl-9 w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg py-2 text-sm font-mono cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 my-4" />

              {/* Editable Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={16} className="text-gray-400" /></div>
                    <input required name="name" type="text" value={formData.name} onChange={handleChange} className="pl-9 w-full border border-gray-300 rounded-lg py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={16} className="text-gray-400" /></div>
                    <input required name="phone" type="text" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210" className="pl-9 w-full border border-gray-300 rounded-lg py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                  </div>
                </div>

                {authUser?.role === 'student' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Course Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BookOpen size={16} className="text-gray-400" /></div>
                          <input required name="course" type="text" value={formData.course} onChange={handleChange} className="pl-9 w-full border border-gray-300 rounded-lg py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Specialization</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BookOpen size={16} className="text-gray-400" /></div>
                          <input required name="specialization" type="text" value={formData.specialization} onChange={handleChange} placeholder="AI & ML" className="pl-9 w-full border border-gray-300 rounded-lg py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Current CGPA</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><GraduationCap size={16} className="text-gray-400" /></div>
                          <input required name="cgpa" type="number" step="0.01" min="0" max="10" value={formData.cgpa} onChange={handleChange} className="pl-9 w-full border border-gray-300 rounded-lg py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {error && <div className="text-red-600 text-xs bg-red-50 p-2 rounded border border-red-100 mt-2">{error}</div>}
              {success && <div className="text-green-600 text-xs bg-green-50 p-2 rounded border border-green-100 mt-2">{success}</div>}
              
              <div className="pt-4 mt-6 border-t border-gray-100">
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 hover:cursor-pointer transition disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-gray-500 bg-gray-50 py-3 rounded-lg border border-gray-100">
            For further assistance mail: <a href="mailto:smartod.rm@gmail.com" className="text-blue-600 font-medium hover:underline">smartod.rm@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
