import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Search, PlusCircle, CheckCircle, 
  MapPin, Calendar, Users, Heart, ArrowRight, Award, BadgeCheck
} from 'lucide-react';
import Avatar from '../components/Avatar';
import { getAnalytics, getLostItems, getFoundItems, getLeaderboard } from '../firestoreService';

export default function Home({ setActivePage, onSelectReportType }) {
  const [stats, setStats] = useState({
    totalReports: 0,
    totalReturned: 0,
    recoveryRate: 0,
    activeUsersCount: 0
  });
  const [recentLost, setRecentLost] = useState([]);
  const [recentFound, setRecentFound] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [successStories, setSuccessStories] = useState([]);

  useEffect(() => {
    // Fetch stats from Firestore
    getAnalytics()
      .then(data => { if (data) setStats(data); })
      .catch(err => console.error(err));

    // Fetch lost items
    getLostItems()
      .then(data => setRecentLost(data.slice(0, 3)))
      .catch(err => console.error(err));

    // Fetch found items
    getFoundItems()
      .then(data => setRecentFound(data.slice(0, 3)))
      .catch(err => console.error(err));

    // Fetch leaderboard
    getLeaderboard()
      .then(data => setLeaderboard(data))
      .catch(err => console.error(err));

    // Fetch returned items for success stories
    getFoundItems({ status: 'Returned' })
      .then(data => setSuccessStories(data.slice(0, 4)))
      .catch(err => console.error(err));
  }, []);

  const handleAction = (page, reportType = '') => {
    if (reportType) {
      onSelectReportType(reportType);
    }
    setActivePage(page);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={containerVariants}
      className="space-y-12 pb-16 gradient-bg min-h-screen px-4 md:px-12"
    >
      {/* Hero Section */}
      <motion.div 
        variants={itemVariants}
        className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/5 my-6"
        style={{ minHeight: '420px' }}
      >
        {/* Campus background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/campus_hero.png" 
            alt="Vignan Institute of Technology and Science Campus" 
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-transparent to-indigo-900/30" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 py-16 md:py-24 px-6 md:px-12 text-center text-white flex flex-col items-center">
          {/* Vignan Logo */}
          <div className="mb-6 relative">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl">
              <img 
                src="/vignan_logo.png" 
                alt="Vignan Institute Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* College Name */}
          <div className="mb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-300/90 block mb-2">
              Est. 2007 · Hyderabad, Telangana
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-heading drop-shadow-lg">
              <span className="bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
                Vignan Institute
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-blue-200/90 mt-1 tracking-wide">
              of Technology &amp; Science
            </p>
          </div>

          {/* Portal tagline */}
          <div className="mt-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Lost &amp; Found Portal</span>
            </div>
            <p className="text-base md:text-lg font-medium text-slate-200/90 leading-relaxed drop-shadow">
              Helping Vignan students reconnect with their lost belongings — powered by AI matching.
            </p>
          </div>

          {/* Campus info pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-[11px] font-semibold px-4 py-1.5 rounded-full">
              📍 Deshmukhi Village, Nalgonda, Telangana
            </span>
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-[11px] font-semibold px-4 py-1.5 rounded-full">
              🎓 JNTUH Affiliated
            </span>
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-[11px] font-semibold px-4 py-1.5 rounded-full">
              🏛️ NAAC Accredited
            </span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-heading">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Report Lost */}
          <div 
            onClick={() => handleAction('report-lost', 'lost')}
            className="glass-panel hover-card-trigger p-6 rounded-2xl cursor-pointer flex flex-col justify-between h-48 border border-white/20 dark:border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
              <PlusCircle size={120} />
            </div>
            <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl w-fit">
              <PlusCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading mb-1">Report Lost Item</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lost something? Post details so others can return it.</p>
            </div>
          </div>

          {/* Card 2: Report Found */}
          <div 
            onClick={() => handleAction('report-found', 'found')}
            className="glass-panel hover-card-trigger p-6 rounded-2xl cursor-pointer flex flex-col justify-between h-48 border border-white/20 dark:border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle size={120} />
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading mb-1">Report Found Item</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Found something on campus? Help reunite it.</p>
            </div>
          </div>

          {/* Card 3: Browse Lost */}
          <div 
            onClick={() => handleAction('browse-lost')}
            className="glass-panel hover-card-trigger p-6 rounded-2xl cursor-pointer flex flex-col justify-between h-48 border border-white/20 dark:border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Search size={120} />
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit">
              <Search size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading mb-1">Browse Lost Items</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Search items reported missing by peers.</p>
            </div>
          </div>

          {/* Card 4: Browse Found */}
          <div 
            onClick={() => handleAction('browse-found')}
            className="glass-panel hover-card-trigger p-6 rounded-2xl cursor-pointer flex flex-col justify-between h-48 border border-white/20 dark:border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 text-accent-600 dark:text-accent-400 group-hover:scale-110 transition-transform">
              <FileText size={120} />
            </div>
            <div className="p-3 bg-accent-500/10 text-accent-600 dark:text-accent-400 rounded-xl w-fit">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-heading mb-1">Browse Found Items</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Check catalog of items retrieved across campus.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-heading">
          Portal Analytics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl text-center border border-white/25 dark:border-white/5">
            <span className="block text-3xl font-extrabold text-brand-600 dark:text-brand-400 font-heading">
              {stats.totalReports || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Reports</span>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-center border border-white/25 dark:border-white/5">
            <span className="block text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
              {stats.totalReturned || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Returned Items</span>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-center border border-white/25 dark:border-white/5">
            <span className="block text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-heading">
              {stats.recoveryRate || 0}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Recovery Rate</span>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-center border border-white/25 dark:border-white/5">
            <span className="block text-3xl font-extrabold text-accent-600 dark:text-accent-400 font-heading">
              {stats.activeUsersCount || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Active Users</span>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Lost */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-heading">
              Recently Lost
            </h2>
            <button 
              onClick={() => handleAction('browse-lost')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
            >
              See all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentLost.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 glass-panel rounded-2xl">No lost items reported yet.</p>
            ) : (
              recentLost.map((item) => (
                <div key={item.id} className="glass-panel p-4 rounded-xl border border-white/20 dark:border-white/5 flex gap-4 hover:scale-[1.01] transition-transform">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      'No Photo'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{item.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>
                    <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {item.lastSeenLocation}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> {item.dateLost}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-900/20 px-2 py-0.5 rounded-full h-fit uppercase tracking-wide">
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Found */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-heading">
              Recently Found
            </h2>
            <button 
              onClick={() => handleAction('browse-found')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
            >
              See all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentFound.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 glass-panel rounded-2xl">No found items reported yet.</p>
            ) : (
              recentFound.map((item) => (
                <div key={item.id} className="glass-panel p-4 rounded-xl border border-white/20 dark:border-white/5 flex gap-4 hover:scale-[1.01] transition-transform">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      'No Photo'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{item.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>
                    <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {item.locationFound}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> {item.dateFound}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full h-fit uppercase tracking-wide">
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Success Stories & Leaderboard */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Success Stories */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-heading">
            Success Stories
          </h2>
          {successStories.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12 glass-panel rounded-2xl">
              No success stories yet. Help return a lost item to create one!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {successStories.map((story) => (
                <div key={story.id} className="glass-panel p-5 rounded-2xl border border-white/20 dark:border-white/5 relative overflow-hidden flex flex-col justify-between h-44">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 uppercase tracking-wider mb-3">
                      <BadgeCheck size={12} /> Returned
                    </span>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-3">
                      "{story.description}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-500 font-semibold truncate">
                    <Heart size={14} className="text-rose-500 fill-rose-500 shrink-0" />
                    <span>Successfully returned: <strong className="text-slate-700 dark:text-white font-bold">{story.name}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Helpful Students Leaderboard */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-heading">
            Student Leaderboard
          </h2>
          <div className="glass-panel p-4 rounded-2xl border border-white/20 dark:border-white/5 space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No helpers listed yet</p>
            ) : (
              leaderboard.map((helper, idx) => (
                <div key={helper.uid || helper.id} className="flex items-center justify-between p-2 rounded-xl bg-white/30 dark:bg-slate-900/20 border border-slate-200/20 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">#{idx + 1}</span>
                    <Avatar 
                      src={helper.photoURL} 
                      name={helper.name} 
                      className="w-8 h-8" 
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">{helper.name}</h4>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Contributor</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 bg-brand-500/10 px-2 py-0.5 rounded-full">
                    <Award size={10} />
                    {helper.points} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
