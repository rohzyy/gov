import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Plus, MapPin, Clock, CalendarDays, Activity, UploadCloud, Download, FileText, X } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';

const mapContainerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 16.5062, 
  lng: 80.6480
};

const AdminDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploadModalEventId, setUploadModalEventId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lat: defaultCenter.lat,
    lng: defaultCenter.lng,
    radius: 100,
    requiredDuration: 120,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/events`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleMapClick = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    }));
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        location: { lat: Number(formData.lat), lng: Number(formData.lng) },
        radius: Number(formData.radius),
        requiredDuration: Number(formData.requiredDuration),
        startTime: new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
        endTime: new Date(`${formData.endDate}T${formData.endTime}`).toISOString()
      };
      
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/events/create`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowForm(false);
      fetchEvents();
      setFormData({
        title: '', description: '', lat: defaultCenter.lat, lng: defaultCenter.lng, radius: 100, requiredDuration: 120,
        startDate: '', startTime: '', endDate: '', endTime: ''
      });
    } catch (err) {
      alert("Error creating event");
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/events/${eventId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchEvents();
    } catch(err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert("Please select a file");
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);

      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/whitelist/${uploadModalEventId}/upload`, formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      alert("Whitelist uploaded successfully!");
      setUploadModalEventId(null);
      setUploadFile(null);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,admissionNumber,email\nAP2111001,user@srmap.edu.in";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "whitelist_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-800">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Admin Panel</h1>
          <p className="text-sm text-gray-500 font-medium">Community Lead & Faculty</p>
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">Manage Events</h2>
          <button 
            type="button"
            onClick={() => setShowForm(true)} 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm hover:cursor-pointer transition hover:shadow-md"
          >
            <Plus size={18} /> <span className="font-medium">Create Event</span>
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg shadow-blue-900/5 border border-gray-100 mb-8 transform transition-all duration-300">
            <h3 className="text-lg font-bold mb-6 text-gray-800 border-b pb-4">New Event Details</h3>
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="E.g., Tech Symposium 2026" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required name="description" value={formData.description} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" rows="2" placeholder="Describe the event..."></textarea>
              </div>

              {/* Map View directly in the form */}
              <div className="col-span-1 md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Location Picker (Click on map to set marker)</label>
                 {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                    <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded mb-2 border border-yellow-200">
                      ℹ️ Using Google Maps Development Mode. Add `VITE_GOOGLE_MAPS_API_KEY` to `client/.env` to remove the watermark if you have one.
                    </div>
                 )}
                 {isLoaded ? (
                   <div className="border border-gray-300 rounded-lg overflow-hidden relative shadow-inner">
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={{ lat: Number(formData.lat) || defaultCenter.lat, lng: Number(formData.lng) || defaultCenter.lng }}
                      zoom={16}
                      onClick={handleMapClick}
                      options={{ mapTypeControl: false, streetViewControl: true }}
                    >
                      <Marker position={{ lat: Number(formData.lat), lng: Number(formData.lng) }} draggable onDragEnd={handleMapClick} />
                      <Circle 
                        center={{ lat: Number(formData.lat), lng: Number(formData.lng) }} 
                        radius={Number(formData.radius)}
                        options={{
                          fillColor: '#3b82f6',
                          fillOpacity: 0.25,
                          strokeColor: '#2563eb',
                          strokeOpacity: 0.9,
                          strokeWeight: 2,
                        }}
                      />
                    </GoogleMap>
                   </div>
                 ) : (
                   <div className="w-full h-[350px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-500">
                     Loading map...
                   </div>
                 )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input required type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input required type="number" step="any" name="lng" value={formData.lng} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50" readOnly />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meters)</label>
                <input required min="10" type="number" name="radius" value={formData.radius} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-blue-600" />
                <p className="text-xs text-gray-500 mt-1">Change this to visualize the circle area instantly on the map.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Duration (mins)</label>
                <input required type="number" name="requiredDuration" value={formData.requiredDuration} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input required type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input required type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input required type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700" />
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:cursor-pointer transition duration-150 font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:cursor-pointer transition hover:shadow-md font-medium">Save Event</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div key={evt._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col items-start hover:shadow-md hover:-translate-y-1 transition duration-200">
              <div className="flex justify-between w-full items-start mb-3">
                <h3 className="text-lg font-bold text-gray-800 line-clamp-1 flex-1 pr-2">{evt.title}</h3>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                  evt.status === 'live' ? 'bg-green-100 text-green-700 border border-green-200' : 
                  evt.status === 'ended' ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {evt.status}
                </span>
              </div>
              
              <p className="text-gray-500 text-sm mb-5 line-clamp-2 min-h-[2.5rem]">{evt.description}</p>
              
              <div className="space-y-2.5 w-full text-sm text-gray-600 mb-5 pb-5 border-b border-gray-100 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-500" />
                  <span className="font-medium text-gray-700">Radius: {evt.radius}m</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-orange-500" />
                  <span className="font-medium text-gray-700">Req: {evt.requiredDuration} mins</span>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-gray-700 text-xs">
                    {new Date(evt.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} <br/>to {new Date(evt.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Whitelist UI Block */}
              <div className="w-full bg-gray-50/70 p-3 rounded-lg border border-gray-100 mb-4 text-sm flex flex-col gap-2.5 shadow-inner">
                <div className="flex justify-between items-center px-1">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    {evt.hasWhitelist ? '✅ Allowed List' : '❌ No Whitelist'}
                  </span>
                  {evt.hasWhitelist && evt.whitelistStats && (
                    <span className="text-[11px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600 font-bold shadow-sm">
                      <span className="text-green-600">{evt.whitelistStats.joined}</span> / {evt.whitelistStats.total} Joined
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setUploadModalEventId(evt._id)}
                  className="w-full bg-white border border-gray-200 hover:border-blue-400 text-gray-600 hover:text-blue-600 font-medium py-1.5 rounded-md transition hover:shadow-sm flex items-center justify-center gap-2 hover:cursor-pointer shadow-sm"
                >
                  <FileText size={15} /> {evt.hasWhitelist ? 'Upload Replacement CSV' : 'Upload Whitelist CSV'}
                </button>
              </div>

              <div className="mt-auto w-full flex justify-between items-center bg-white">
                <select 
                  className="bg-gray-50 border border-gray-200 outline-none text-sm p-1.5 rounded-md text-gray-700 font-medium hover:cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={evt.status} 
                  onChange={(e) => handleStatusChange(evt._id, e.target.value)}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="ended">Ended</option>
                </select>
                
                <button onClick={() => navigate('/admin/event/' + evt._id)} className="text-blue-600 text-sm font-semibold hover:text-blue-800 flex items-center gap-1 hover:cursor-pointer bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
                  <Activity size={16} /> Dashboard
                </button>
              </div>
            </div>
          ))}
          {events.length === 0 && !showForm && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <CalendarDays size={48} className="text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">No events deployed yet.</p>
              <p className="text-sm">Click the <strong>Create Event</strong> button to get started.</p>
            </div>
          )}
        </div>
      </main>

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        authUser={user}
        updateAuthUser={updateUser}
      />

      {/* CSV Upload Modal Layer */}
      {uploadModalEventId && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 flex flex-col gap-4 relative text-gray-800 transform transition-all scale-100">
            <button onClick={() => setUploadModalEventId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 hover:cursor-pointer p-1 rounded-md hover:bg-gray-100 transition"><X size={18} /></button>
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-3">
              <UploadCloud size={20} className="text-blue-500" /> Upload Whitelist
            </h3>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-1">Select a standard CSV file. The columns must strictly be labeled <code className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-blue-700 font-mono text-xs">admissionNumber</code> and <code className="bg-blue-50 px-1.5 py-0.5 border border-blue-100 rounded text-blue-700 font-mono text-xs">email</code>.</p>
            
            <button onClick={downloadTemplate} className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 bg-green-50 text-green-700 py-2 border border-green-200 rounded-lg hover:bg-green-100 hover:cursor-pointer transition shadow-sm mb-1">
              <Download size={14} /> Download Sample Template
            </button>

            <form onSubmit={handleFileUpload} className="flex flex-col gap-4 mt-2 border-t border-dashed border-gray-200 pt-4">
              <input 
                type="file" 
                accept=".csv"
                required
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:hover:cursor-pointer file:transition cursor-pointer" 
              />
              
              <button disabled={uploading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-lg transition hover:shadow-md disabled:opacity-50 hover:cursor-pointer flex items-center justify-center gap-2">
                {uploading ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent"></div> Processing...</span>
                ) : 'Deploy Whitelist Securely'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
