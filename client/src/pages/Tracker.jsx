import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, AlertTriangle, CheckCircle, Navigation, Clock, Activity, Loader } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '0.75rem'
};

const Tracker = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [status, setStatus] = useState('Initializing...');
  const [isInside, setIsInside] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [evtLoc, setEvtLoc] = useState(null);
  const [evtRadius, setEvtRadius] = useState(null);
  
  const timerRef = useRef(null);
  const isInsideRef = useRef(false);

  useEffect(() => {
    const sessionId = localStorage.getItem(`session_${eventId}`);
    if (!sessionId) {
      setError("No active session found. Please join the event again.");
      return;
    }

    const sendPing = () => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            setCurrentLoc({ lat: latitude, lng: longitude });
            if (accuracy > 1000) { // Relaxed to 1000m for laptop testing
              setStatus(`Poor GPS accuracy (${Math.round(accuracy)}m). Waiting for better signal...`);
              return;
            }

            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/location/ping`, {
              eventId,
              lat: latitude,
              lng: longitude,
              accuracy,
              sessionId,
              timestamp: new Date().toISOString()
            }, {
              headers: { Authorization: `Bearer ${user.token}` }
            });

            const data = res.data;
            if (data.isInside !== undefined && data.isInside !== null) {
               setIsInside(data.isInside);
               isInsideRef.current = data.isInside;
            }
            setStats(data);
            if (data.distance) setDistance(data.distance);
            if (data.eventLocation) setEvtLoc(data.eventLocation);
            if (data.eventRadius) setEvtRadius(data.eventRadius);
            
            if (data.status === 'rejected') {
              setError("Your OD has been rejected because you left the area for too long.");
              clearInterval(timerRef.current);
            } else if (data.status === 'approved') {
              setStatus("OD Approved! You have successfully completed the required duration.");
              clearInterval(timerRef.current);
            } else {
              setStatus(data.isInside ? "Successfully tracking. You are inside the event zone." : "Warning: You are outside the event zone!");
            }
            
            scheduleNextPing();
          } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Connection error. Retrying...");
            scheduleNextPing();
          }
        },
        (err) => {
          setError(`Location error: ${err.message}. Please enable precise location.`);
          scheduleNextPing();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    };

    const scheduleNextPing = () => {
      clearInterval(timerRef.current);
      const delay = isInsideRef.current ? 60000 : 15000;
      timerRef.current = setInterval(sendPing, delay);
    };

    sendPing();

    return () => clearInterval(timerRef.current);
  }, [eventId, user.token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex justify-center items-center gap-2">
          <Navigation className="text-blue-500 animate-pulse" /> Live Tracking
        </h1>
        
        {error && !stats?.status?.includes('approved') ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
            <AlertTriangle className="mx-auto mb-2" size={32} />
            <p className="font-medium">{error}</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 hover:cursor-pointer transition">Return to Dashboard</button>
          </div>
        ) : (
          <>
            <div className={`p-6 rounded-2xl mb-6 transition-colors duration-500 ${isInside === null ? 'bg-gray-50 border-gray-200' : isInside ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border`}>
              {stats?.status === 'approved' ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="text-green-500 mb-2" size={48} />
                  <p className="text-green-800 font-bold text-lg mb-1">OD Approved!</p>
                  <p className="text-green-600 font-medium text-sm">Duration successfully met.</p>
                </div>
              ) : isInside === null ? (
                <div className="flex flex-col items-center">
                  <Loader className="animate-spin text-blue-500 mb-2" size={32} />
                  <p className="text-gray-600 font-medium">{status}</p>
                </div>
              ) : isInside ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="text-green-500 mb-2" size={48} />
                  <p className="text-green-800 font-bold text-lg mb-1">Inside Event Radius</p>
                  <p className="text-green-600 font-medium text-sm">{status}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <AlertTriangle className="text-orange-500 mb-2 animate-bounce" size={48} />
                  <p className="text-orange-800 font-bold text-lg mb-1">Outside Event Radius</p>
                  <p className="text-orange-700 font-medium text-sm">{status}</p>
                  <p className="text-xs text-orange-600 mt-2 font-semibold bg-orange-100 px-3 py-1 rounded-full">Return within 10 minutes to avoid cancellation!</p>
                </div>
              )}
            </div>

            {isLoaded && currentLoc && evtLoc && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
                {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                  <div className="absolute top-2 left-2 right-2 z-10 bg-yellow-50/90 backdrop-blur text-yellow-800 text-xs p-1.5 rounded shadow-sm border border-yellow-200 text-center font-medium">
                    Development Mode Map
                  </div>
                )}
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={currentLoc}
                  zoom={17}
                  options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: false }}
                >
                  <Marker position={currentLoc} title="You" />
                  <Circle
                    center={evtLoc}
                    radius={evtRadius}
                    options={{
                      fillColor: '#3b82f6',
                      fillOpacity: 0.15,
                      strokeColor: '#2563eb',
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                    }}
                  />
                  <Marker 
                    position={evtLoc} 
                    icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }} 
                    title="Event Center"
                  />
                </GoogleMap>
              </div>
            )}

            {stats && (
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6 text-left space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 flex items-center gap-2"><Clock size={16}/> Time Inside</span>
                  <span className="font-bold text-gray-800">{Math.floor(stats.totalInsideTime / 60)} / {stats.requiredSeconds / 60} mins</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 flex items-center gap-2"><MapPin size={16}/> Distance from Center</span>
                  <span className="font-bold text-gray-800">{distance ? Math.round(distance) : '--'} meters</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2"><Activity size={16}/> Status</span>
                  <span className={`font-bold capitalize px-2.5 py-1 text-xs rounded-full ${stats.status === 'approved' ? 'bg-green-100 text-green-700' : stats.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {stats.status}
                  </span>
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-400 mb-6 flex flex-col gap-1 items-center">
              <span>Ping frequency: {isInside ? 'Auto-updates every 60s' : 'Auto-updates every 15s to regain lock'}</span>
              <span>Keep this page open or in the background</span>
            </p>

            <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition hover:cursor-pointer">
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Tracker;
