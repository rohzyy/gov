import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Clock, CalendarDays, CheckCircle, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';

const StudentDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [joinError, setJoinError] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    fetchMyEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/events`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEvents(res.data.filter(e => e.status !== 'ended'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/participation/my-events`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMyEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (eventId) => {
    try {
      setJoinError('');
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/participation/${eventId}/join`, 
        { course: 'B.Tech', cgpa: 9.0 },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      // alert(res.data.message);
      localStorage.setItem(`session_${eventId}`, res.data.sessionId);
      fetchMyEvents();
      setActiveTab('myEvents');
    } catch (err) {
      setJoinError(err.response?.data?.error || "Failed to join event");
      alert(err.response?.data?.error || "Failed to join event");
    }
  };

  const handleStartTracking = (eventId) => {
    navigate(`/track/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-800">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Student Portal</h1>
          <p className="text-sm text-gray-500 font-medium">{user?.admissionNumber}</p>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setShowProfileModal(true)} className="text-sm font-semibold rounded-full bg-blue-50 text-blue-700 px-3 py-1 border border-blue-100 hover:bg-blue-100 hover:cursor-pointer transition duration-150">
              {user?.name}
            </button>
            <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium hover:cursor-pointer transition duration-150 text-sm bg-red-50 px-3 py-1.5 rounded hover:bg-red-100">
            Logout
            </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex gap-4 mb-8 border-b border-gray-200 pb-2">
          <button 
            className={`px-4 py-2 font-medium text-lg border-b-2 transition-colors hover:cursor-pointer ${activeTab === 'browse' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('browse')}
          >
            Available Events
          </button>
          <button 
            className={`px-4 py-2 font-medium text-lg border-b-2 transition-colors hover:cursor-pointer ${activeTab === 'myEvents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('myEvents')}
          >
            My OD Applications
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {events.map((evt) => {
              const hasJoined = myEvents.some(p => p.eventId?._id === evt._id);
              return (
              <div key={evt._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col items-start hover:shadow-md transition">
                <h3 className="text-lg font-bold text-gray-800 line-clamp-1 mb-2">{evt.title}</h3>
                <span className={`px-2.5 py-1 mb-3 text-xs font-bold rounded-full uppercase ${evt.status === 'live' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                  {evt.status}
                </span>
                
                <p className="text-gray-500 text-sm mb-5 line-clamp-2 min-h-[2.5rem]">{evt.description}</p>
                
                <div className="space-y-2.5 w-full text-sm text-gray-600 mb-5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-orange-500" />
                    <span className="font-medium text-gray-700">OD Duration: {evt.requiredDuration} mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-blue-500" />
                    <span className="font-medium text-gray-700">
                      {new Date(evt.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="mt-auto w-full">
                  {hasJoined ? (
                    <button disabled className="w-full py-2.5 bg-green-50 text-green-700 rounded-lg font-medium border border-green-200 flex justify-center items-center gap-2 cursor-not-allowed">
                      <CheckCircle size={18} /> Registered
                    </button>
                  ) : evt.hasWhitelist && !evt.isWhitelisted ? (
                    <button disabled className="w-full py-2.5 bg-gray-50 text-gray-400 rounded-lg font-medium flex justify-center items-center cursor-not-allowed border border-gray-200 shadow-inner">
                      You are not eligible for this event
                    </button>
                  ) : (
                    <button onClick={() => handleJoin(evt._id)} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 hover:cursor-pointer transition shadow-sm">
                      Apply / Join Event
                    </button>
                  )}
                </div>
              </div>
            )})}
            {events.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                No active events available at the moment.
              </div>
            )}
          </div>
        )}

        {activeTab === 'myEvents' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {myEvents.map((participation) => {
              const evt = participation.eventId;
              if (!evt) return null;
              
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                approved: 'bg-green-100 text-green-800 border-green-400',
                rejected: 'bg-red-100 text-red-800 border-red-200',
                suspicious: 'bg-orange-100 text-orange-800 border-orange-200'
              };

              return (
              <div key={participation._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col items-start relative hover:shadow-md transition">
                <h3 className="text-lg font-bold text-gray-800 line-clamp-1 flex-1 pr-2 mb-3">{evt.title}</h3>
                
                <div className="flex gap-2 mb-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase border ${statusColors[participation.status]}`}>
                    OD: {participation.status}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase border ${evt.status === 'live' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    Event: {evt.status}
                  </span>
                </div>

                <div className="space-y-2.5 w-full text-sm text-gray-600 mb-5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex justify-between w-full">
                    <span className="font-medium">Time Inside:</span>
                    <span>{Math.floor((participation.totalInsideTime || 0) / 60)} / {evt.requiredDuration} mins</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((participation.totalInsideTime || 0) / 60 / evt.requiredDuration) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="mt-auto w-full">
                  {evt.status === 'live' && participation.status === 'pending' ? (
                    <button onClick={() => {
                        localStorage.setItem(`session_${evt._id}`, participation.sessionId);
                        handleStartTracking(evt._id);
                      }} className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:from-emerald-600 hover:to-green-700 hover:cursor-pointer transition shadow-sm hover:shadow">
                      <Navigation size={18} /> Start Area Tracking
                    </button>
                  ) : (
                    <button disabled className="w-full py-2.5 bg-gray-50 text-gray-400 rounded-lg font-medium cursor-not-allowed border border-gray-200">
                      Tracking Unavailable
                    </button>
                  )}
                </div>
              </div>
            )})}
            {myEvents.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                You haven't applied for any events yet.
              </div>
            )}
          </div>
        )}
      </main>

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        authUser={user}
        updateAuthUser={updateUser}
      />
    </div>
  );
};

export default StudentDashboard;
