import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, CreditCard, Lock, Shield } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', admissionNumber: '', password: '', role: 'student',
    course: '', specialization: '', yearOfStudy: '', cgpa: '', phone: '', otp: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      if (!formData.email.endsWith('@srmap.edu.in')) {
        return setError("Only @srmap.edu.in email addresses are allowed.");
      }

      if (formData.role === 'student' && formData.phone) {
        const phoneRegex = /^(?:\+91|91)?\s?[6789]\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
          return setError("Please provide a valid Indian phone number (+91).");
        }
      }

      setLoading(true);

      if (formData.role === 'student' && !otpSent) {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/send-otp`, { email: formData.email });
        setOtpSent(true);
        setSuccess('OTP sent to your email. Please check your inbox.');
        setLoading(false);
        return;
      }

      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/register`, formData);
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data || 'An error occurred during registration');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create Account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><User className="h-5 w-5 text-gray-400" /></div>
                <input name="name" type="text" required onChange={handleChange} className="pl-10 block w-full outline-none sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input name="email" type="email" required onChange={handleChange} className="pl-10 block w-full outline-none sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="john@srmap.edu.in" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Admission Number</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><CreditCard className="h-5 w-5 text-gray-400" /></div>
                <input name="admissionNumber" type="text" required onChange={handleChange} className="pl-10 block w-full outline-none sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="AP211100..." />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input name="password" type="password" required onChange={handleChange} className="pl-10 block w-full outline-none sm:text-sm border-gray-300 rounded-md py-2 border" placeholder="••••••••" />
              </div>
            </div>

            {formData.role === 'student' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                    <input disabled={otpSent} name="course" type="text" required onChange={handleChange} className="w-full outline-none sm:text-sm border-gray-300 rounded-md py-2 px-3 border disabled:bg-gray-50" placeholder="B.Tech" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                    <input disabled={otpSent} name="specialization" type="text" required onChange={handleChange} className="w-full outline-none sm:text-sm border-gray-300 rounded-md py-2 px-3 border disabled:bg-gray-50" placeholder="AI & ML" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                    <input disabled={otpSent} name="yearOfStudy" type="number" min="1" max="5" required onChange={handleChange} className="w-full outline-none sm:text-sm border-gray-300 rounded-md py-2 px-3 border disabled:bg-gray-50" placeholder="3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current CGPA</label>
                    <input disabled={otpSent} name="cgpa" type="number" step="0.01" min="0" max="10" required onChange={handleChange} className="w-full outline-none sm:text-sm border-gray-300 rounded-md py-2 px-3 border disabled:bg-gray-50" placeholder="9.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input disabled={otpSent} name="phone" type="tel" required onChange={handleChange} className="w-full outline-none sm:text-sm border-gray-300 rounded-md py-2 px-3 border disabled:bg-gray-50" placeholder="9876543210" />
                  </div>
                </div>
              </>
            )}

            {otpSent && (
              <div className="pt-2 border-t border-gray-100 mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP Sent to Email</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center"><Shield className="h-5 w-5 text-gray-400" /></div>
                  <input name="otp" type="text" required onChange={handleChange} className="pl-10 block w-full outline-none sm:text-lg border-blue-400 rounded-md py-2.5 border-2 tracking-widest font-mono text-center bg-blue-50 focus:border-blue-500 focus:ring-blue-500 transition-all text-blue-900 font-bold" placeholder="123456" maxLength="6" />
                </div>
              </div>
            )}

            {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
            {success && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</div>}

            <button disabled={loading} type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:cursor-pointer transition duration-150 disabled:opacity-75 disabled:cursor-not-allowed">
              {loading ? 'Processing...' : (formData.role === 'student' && !otpSent ? 'Send OTP to Email' : (otpSent ? 'Verify OTP & Register' : 'Sign up'))}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
