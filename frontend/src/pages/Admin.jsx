import { API_URL, BASE_URL } from '../config.js';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Trash2, CheckCircle2, Users, FileText, 
  MapPin, Calendar, Award, ShieldCheck, AlertOctagon, BarChart2
} from 'lucide-react';
import Avatar from '../components/Avatar';

export default function Admin() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('analytics'); // 'analytics' | 'listings' | 'users'
  const [analytics, setAnalytics] = useState(null);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Local verification list
  const [verifiedItemIds, setVerifiedItemIds] = useState(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const analyticsRes = await fetch(`${API_URL}/admin/analytics`);
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      const lostRes = await fetch(`${API_URL}/lost-items`);
      if (lostRes.ok) {
        const lostData = await lostRes.json();
        setLostItems(lostData);
      }

      const foundRes = await fetch(`${API_URL}/found-items`);
      if (foundRes.ok) {
        const foundData = await foundRes.json();
        setFoundItems(foundData);
      }

      // Fetch users list (can reuse leaderboard for lists)
      const usersRes = await fetch(`${API_URL}/users/leaderboard`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user]);

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} report?`)) return;
    try {
      const res = await fetch(`${API_URL}/items/${type}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setActionMsg('Report deleted successfully.');
        setTimeout(() => setActionMsg(''), 3000);
        loadData();
      }
    } catch (err) {
      console.error(err);
      setActionMsg('Failed to delete report.');
    }
  };

  const toggleVerify = (itemId) => {
    const updated = new Set(verifiedItemIds);
    if (updated.has(itemId)) {
      updated.delete(itemId);
    } else {
      updated.add(itemId);
    }
    setVerifiedItemIds(updated);
    setActionMsg('Report verification toggled.');
    setTimeout(() => setActionMsg(''), 2000);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-slate-500 font-semibold min-h-screen">
        <AlertOctagon size={44} className="mx-auto text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">Access Denied</h2>
        <p className="text-xs text-slate-400 mt-2">Only administrators can access the admin dashboard panel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:px-12 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white font-heading flex items-center gap-2">
            <ShieldAlert size={28} className="text-rose-500" />
            Portal Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage reports, users, view logs, and track statistics.
          </p>
        </div>

        {/* Sub-tabs selector */}
        <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              activeSubTab === 'analytics'
                ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <BarChart2 size={14} /> Analytics
          </button>
          <button
            onClick={() => setActiveSubTab('listings')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              activeSubTab === 'listings'
                ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <FileText size={14} /> Reports
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              activeSubTab === 'users'
                ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Users size={14} /> Users
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-brand-500/10 text-brand-600 text-xs rounded-xl font-bold mb-6 text-left border border-brand-500/20">
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold">Loading admin panel...</div>
      ) : (
        <div>
          {/* TAB 1: ANALYTICS */}
          {activeSubTab === 'analytics' && analytics && (
            <div className="space-y-8">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-2xl text-left border border-white/20 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reports Logged</span>
                  <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white font-heading mt-1">{analytics.totalReports}</h3>
                </div>
                <div className="glass-panel p-6 rounded-2xl text-left border border-white/20 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recovery Rate</span>
                  <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading mt-1">{analytics.recoveryRate}%</h3>
                </div>
                <div className="glass-panel p-6 rounded-2xl text-left border border-white/20 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Active Users</span>
                  <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-heading mt-1">{analytics.totalUsers}</h3>
                </div>
                <div className="glass-panel p-6 rounded-2xl text-left border border-white/20 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Returned Items</span>
                  <h3 className="text-3xl font-extrabold text-accent-600 dark:text-accent-400 font-heading mt-1">{analytics.totalReturned}</h3>
                </div>
              </div>

              {/* Graphical representation panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                {/* Commonly Lost Categories */}
                <div className="glass-panel p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading border-b border-slate-200/40 dark:border-white/5 pb-2">
                    Most Commonly Lost Categories
                  </h3>
                  <div className="space-y-4">
                    {analytics.mostCommonItems.length === 0 ? (
                      <p className="text-xs text-slate-400">No category statistics yet</p>
                    ) : (
                      analytics.mostCommonItems.map((item, idx) => {
                        const percent = analytics.totalReports > 0 
                          ? Math.round((item.count / analytics.totalReports) * 100)
                          : 0;
                        return (
                          <div key={item.category} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-700 dark:text-slate-200">{item.category}</span>
                              <span className="text-slate-400">{item.count} reports ({percent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-rose-500 to-indigo-500 h-2 rounded-full" 
                                style={{ width: `${Math.max(percent, 5)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Common Lost & Found locations */}
                <div className="glass-panel p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading border-b border-slate-200/40 dark:border-white/5 pb-2">
                    Most Common Locations
                  </h3>
                  <div className="space-y-4">
                    {analytics.mostCommonLocations.length === 0 ? (
                      <p className="text-xs text-slate-400">No location statistics yet</p>
                    ) : (
                      analytics.mostCommonLocations.map((item, idx) => {
                        const percent = analytics.totalReports > 0 
                          ? Math.round((item.count / analytics.totalReports) * 100)
                          : 0;
                        return (
                          <div key={item.location} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-700 dark:text-slate-200">{item.location}</span>
                              <span className="text-slate-400">{item.count} occurrences ({percent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full" 
                                style={{ width: `${Math.max(percent, 5)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE LISTINGS */}
          {activeSubTab === 'listings' && (
            <div className="glass-panel rounded-3xl border border-white/20 dark:border-white/5 overflow-hidden text-left shadow-2xl">
              <div className="p-6 border-b border-slate-200/40 dark:border-white/5">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading">
                  Moderation Center
                </h3>
                <p className="text-xs text-slate-400 mt-1">Review active posts, verify legitimacy, and delete spam listings.</p>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse text-xs text-slate-600 dark:text-slate-300">
                  <thead>
                    <tr className="bg-slate-500/5 dark:bg-slate-950/20 text-slate-400 font-semibold border-b border-slate-200/50 dark:border-white/5 uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-6 text-left">Type</th>
                      <th className="py-4 px-4 text-left">Item Name</th>
                      <th className="py-4 px-4 text-left">Category</th>
                      <th className="py-4 px-4 text-left">Location</th>
                      <th className="py-4 px-4 text-left">Date</th>
                      <th className="py-4 px-4 text-left">Reporter</th>
                      <th className="py-4 px-4 text-center">Verification</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                    {/* Lost listings */}
                    {lostItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">Lost</span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">{item.name}</td>
                        <td className="py-4 px-4">{item.category}</td>
                        <td className="py-4 px-4">{item.lastSeenLocation}</td>
                        <td className="py-4 px-4">{item.dateLost}</td>
                        <td className="py-4 px-4 truncate max-w-[120px] font-mono text-[10px]" title={item.reporterEmail || item.reporterId}>{item.reporterEmail || item.reporterId}</td>
                        <td className="py-4 px-4 text-center">
                          {verifiedItemIds.has(item.id) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <ShieldCheck size={14} /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Unverified</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => toggleVerify(item.id)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-500 transition-colors"
                              title="Toggle Verify Badge"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete('lost', item.id)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 transition-colors"
                              title="Delete Spam"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Found listings */}
                    {foundItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Found</span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">{item.name}</td>
                        <td className="py-4 px-4">{item.category}</td>
                        <td className="py-4 px-4">{item.locationFound}</td>
                        <td className="py-4 px-4">{item.dateFound}</td>
                        <td className="py-4 px-4 truncate max-w-[120px] font-mono text-[10px]" title={item.reporterEmail || item.reporterId}>{item.reporterEmail || item.reporterId}</td>
                        <td className="py-4 px-4 text-center">
                          {verifiedItemIds.has(item.id) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <ShieldCheck size={14} /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Unverified</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => toggleVerify(item.id)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-500 transition-colors"
                              title="Toggle Verify Badge"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete('found', item.id)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 transition-colors"
                              title="Delete Spam"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: USERS LIST */}
          {activeSubTab === 'users' && (
            <div className="glass-panel rounded-3xl border border-white/20 dark:border-white/5 overflow-hidden text-left shadow-2xl">
              <div className="p-6 border-b border-slate-200/40 dark:border-white/5">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading">
                  User Registry
                </h3>
                <p className="text-xs text-slate-400 mt-1">Monitor active accounts, toggle roles, and review help contributions.</p>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse text-xs text-slate-600 dark:text-slate-300">
                  <thead>
                    <tr className="bg-slate-500/5 dark:bg-slate-950/20 text-slate-400 font-semibold border-b border-slate-200/50 dark:border-white/5 uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-6 text-left">Avatar</th>
                      <th className="py-4 px-4 text-left">Full Name</th>
                      <th className="py-4 px-4 text-left">Email Address</th>
                      <th className="py-4 px-4 text-left">Account UID</th>
                      <th className="py-4 px-4 text-center">System Role</th>
                      <th className="py-4 px-6 text-center">Help points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                    {usersList.map(item => (
                      <tr key={item.uid} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                        <td className="py-4 px-6">
                          <Avatar 
                            src={item.photoURL} 
                            name={item.name} 
                            className="w-8 h-8" 
                          />
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">{item.name}</td>
                        <td className="py-4 px-4">{item.email}</td>
                        <td className="py-4 px-4 font-mono text-[10px] text-slate-400">{item.uid}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            item.role === 'admin' 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                            <Award size={10} /> {item.points || 0} pts
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
