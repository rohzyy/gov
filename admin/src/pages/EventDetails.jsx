import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Users, Filter, ArrowLeft, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

const EventDetails = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/participation/${eventId}/participants`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setParticipants(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 10000);
    return () => clearInterval(interval);
  }, [eventId, user.token]);

  const filtered = participants.filter(p => {
    if (filter === 'inside') return p.isInside === true;
    if (filter === 'outside') return p.isInside === false && p.status !== 'approved';
    if (filter === 'completed') return p.status === 'approved';
    if (filter === 'suspicious') return p.status === 'suspicious' || p.isFlagged;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-600 mb-6 hover:text-blue-600 transition hover:cursor-pointer">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="text-blue-500" /> Event Participants
            <span className="bg-blue-100 text-blue-700 text-sm py-1 px-3 rounded-full">{participants.length} Total</span>
          </h1>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <Filter size={18} className="text-gray-400 ml-2" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="border-none outline-none bg-transparent text-sm font-medium text-gray-700 hover:cursor-pointer p-1 pr-6"
            >
              <option value="all">All Participants</option>
              <option value="inside">Currently Inside</option>
              <option value="outside">Currently Outside</option>
              <option value="completed">OD Approved</option>
              <option value="suspicious">Flagged / Suspicious</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">Student Info</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Location State</th>
                  <th className="p-4">Time Inside</th>
                  <th className="p-4 pr-6">Recent Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-gray-800">{p.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{p.admissionNumber}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                        p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        p.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                        p.status === 'suspicious' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {p.isInside ? (
                        <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                          <CheckCircle size={14} /> Inside
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-red-500 font-medium">
                          <Clock size={14} /> Outside
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-700">
                      {Math.floor((p.totalInsideTime || 0) / 60)} mins
                    </td>
                    <td className="p-4 pr-6">
                      <div className="text-xs text-gray-500 max-w-xs truncate" title={p.logs[p.logs.length-1]?.action}>
                        {p.logs[p.logs.length-1] ? (
                          <>
                            <span className="font-medium text-gray-700">{p.logs[p.logs.length-1].action}</span>
                            <br/>
                            {new Date(p.logs[p.logs.length-1].timestamp).toLocaleTimeString()}
                          </>
                        ) : 'No logs'}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No participants match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
