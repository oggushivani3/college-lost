import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  FileText, Check, X, Shield, Award, Mail, 
  MapPin, Calendar, Bell, ClipboardCheck, ArrowRight, UserCheck
} from 'lucide-react';
import Avatar from '../components/Avatar';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'claims' | 'notifications'
  const [dashboardData, setDashboardData] = useState({
    myLost: [],
    myFound: [],
    myClaims: [],
    incomingClaims: [],
    returnedItems: []
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({ id: '', type: '', text: '' });

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.uid}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }

      const notifRes = await fetch(`http://localhost:5000/api/notifications/${user.uid}`);
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    refreshUser(); // Refresh user details like points
  }, [user]);

  const handleClaimResponse = async (claimId, response) => {
    setActionMsg({ id: claimId, type: 'info', text: 'Processing...' });
    try {
      const res = await fetch(`http://localhost:5000/api/claims/${claimId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      if (res.ok) {
        setActionMsg({ 
          id: claimId, 
          type: 'success', 
          text: `Claim request ${response.toLowerCase()}ed successfully!` 
        });
        // Refresh dashboard statistics and data
        fetchDashboardData();
        refreshUser();
      } else {
        const err = await res.json();
        setActionMsg({ id: claimId, type: 'error', text: err.error || 'Failed to respond to claim.' });
      }
    } catch (err) {
      console.error(err);
      setActionMsg({ id: claimId, type: 'error', text: 'Server connection error.' });
    }
  };

  const markRead = async (notifId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${notifId}/read`, { method: 'POST' });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === notifId ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-semibold min-h-screen">
        Please sign in to view your dashboard.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-12 min-h-screen">
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 md:p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 mb-8 text-left"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar 
            src={user.photoURL} 
            name={user.name} 
            className="w-20 h-20 border-2 border-brand-500 p-0.5" 
          />
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white font-heading">
              {user.name}
            </h2>
            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail size={12} /> {user.email}
            </p>
            <div className="flex gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                user.role === 'admin' 
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' 
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
              }`}>
                {user.role}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center gap-1">
                <Award size={10} /> {user.points || 0} Points
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Quick Stats */}
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex-1 md:flex-initial text-center px-4 py-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5 min-w-[80px]">
            <span className="block text-lg font-bold text-slate-800 dark:text-white font-heading">
              {dashboardData.myLost.length + dashboardData.myFound.length}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reports</span>
          </div>
          <div className="flex-1 md:flex-initial text-center px-4 py-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5 min-w-[80px]">
            <span className="block text-lg font-bold text-slate-800 dark:text-white font-heading">
              {dashboardData.incomingClaims.length}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Requests</span>
          </div>
          <div className="flex-1 md:flex-initial text-center px-4 py-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5 min-w-[80px]">
            <span className="block text-lg font-bold text-slate-800 dark:text-white font-heading">
              {dashboardData.returnedItems.length}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Returned</span>
          </div>
        </div>
      </motion.div>

      {/* Selector Tabs */}
      <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-2xl mb-8 max-w-md">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all duration-200 ${
            activeTab === 'items'
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          My Listings
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all duration-200 ${
            activeTab === 'claims'
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Claims ({dashboardData.incomingClaims.length + dashboardData.myClaims.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all duration-200 ${
            activeTab === 'notifications'
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Inbox ({notifications.filter(n => !n.read).length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-semibold">Loading data...</div>
      ) : (
        <div>
          {/* TAB 1: MY ITEMS */}
          {activeTab === 'items' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* Lost items */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading">
                  My Reported Lost Items
                </h3>
                <div className="space-y-3">
                  {dashboardData.myLost.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10 glass-panel rounded-2xl">No lost items reported yet.</p>
                  ) : (
                    dashboardData.myLost.map(item => (
                      <div key={item.id} className="glass-panel p-4 rounded-xl border border-white/20 dark:border-white/5 flex gap-4">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                          {item.imageUrl ? <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:5000${item.imageUrl}`} className="w-full h-full object-cover" /> : <div className="text-[9px] text-slate-400 h-full flex items-center justify-center font-bold">No Photo</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
                          <div className="flex gap-4 mt-2 text-[9px] text-slate-400 font-semibold">
                            <span className="flex items-center gap-1"><MapPin size={10} /> {item.lastSeenLocation}</span>
                            <span className="flex items-center gap-1"><Calendar size={10} /> {item.dateLost}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider h-fit ${
                          item.status === 'Lost' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Found items */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading">
                  My Reported Found Items
                </h3>
                <div className="space-y-3">
                  {dashboardData.myFound.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10 glass-panel rounded-2xl">No found items reported yet.</p>
                  ) : (
                    dashboardData.myFound.map(item => (
                      <div key={item.id} className="glass-panel p-4 rounded-xl border border-white/20 dark:border-white/5 flex gap-4">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                          {item.imageUrl ? <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:5000${item.imageUrl}`} className="w-full h-full object-cover" /> : <div className="text-[9px] text-slate-400 h-full flex items-center justify-center font-bold">No Photo</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
                          <div className="flex gap-4 mt-2 text-[9px] text-slate-400 font-semibold">
                            <span className="flex items-center gap-1"><MapPin size={10} /> {item.locationFound}</span>
                            <span className="flex items-center gap-1"><Calendar size={10} /> {item.dateFound}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider h-fit ${
                          item.status === 'Found' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLAIMS */}
          {activeTab === 'claims' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* Incoming Claim Requests (Finder actions) */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading">
                  Received Claim Requests
                </h3>
                <div className="space-y-4">
                  {dashboardData.incomingClaims.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10 glass-panel rounded-2xl">No incoming claims requests</p>
                  ) : (
                    dashboardData.incomingClaims.map(claim => (
                      <div key={claim.id} className="glass-panel p-5 rounded-2xl border border-white/20 dark:border-white/5 space-y-4 shadow-md">
                        <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/5 pb-3">
                          <div>
                            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">Claim Request</span>
                            <h4 className="font-extrabold text-slate-800 dark:text-white text-sm mt-0.5">{claim.item?.name || 'Found Item'}</h4>
                          </div>
                          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-semibold tracking-wide">
                            {claim.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="text-slate-400">Claimant ID:</p>
                          <p className="font-mono text-[10px] text-slate-600 dark:text-slate-300 font-bold bg-white/30 dark:bg-slate-900/30 p-2 rounded border border-slate-200/50 dark:border-white/5 truncate">
                            {claim.claimantId}
                          </p>
                        </div>

                        {/* Status alert message */}
                        {actionMsg.id === claim.id && (
                          <div className={`p-2 rounded-lg text-xs ${
                            actionMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'
                          }`}>
                            {actionMsg.text}
                          </div>
                        )}

                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleClaimResponse(claim.id, 'Accept')}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} /> Accept Claim
                          </button>
                          <button
                            onClick={() => handleClaimResponse(claim.id, 'Reject')}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Claims submitted by current user (Claimant status) */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading">
                  My Filed Claims
                </h3>
                <div className="space-y-3">
                  {dashboardData.myClaims.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10 glass-panel rounded-2xl">No filed claims</p>
                  ) : (
                    dashboardData.myClaims.map(claim => (
                      <div key={claim.id} className="glass-panel p-4 rounded-xl border border-white/20 dark:border-white/5 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white">{claim.item?.name || 'Item Claimed'}</h4>
                          <div className="flex gap-4 mt-2 text-[9px] text-slate-400 font-semibold">
                            <span className="flex items-center gap-1"><UserCheck size={10} /> Finder: {claim.finderId.substr(0, 8)}...</span>
                            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(claim.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          claim.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30'
                            : claim.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl mx-auto space-y-4 text-left">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading">
                Notification Inbox
              </h3>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10 glass-panel rounded-2xl">No notifications yet.</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => markRead(notif.id)}
                      className={`glass-panel p-4 rounded-xl border transition-all duration-200 cursor-pointer flex gap-4 ${
                        notif.read 
                          ? 'border-transparent opacity-70' 
                          : 'border-brand-500/30 bg-brand-500/5'
                      }`}
                    >
                      <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl h-fit">
                        <Bell size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${notif.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-white font-semibold'}`}>
                          {notif.message}
                        </p>
                        <span className="block text-[9px] text-slate-400 mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!notif.read && (
                        <span className="w-2.5 h-2.5 bg-brand-500 rounded-full shrink-0 align-middle mt-1.5"></span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
