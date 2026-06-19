import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Grid, List, MapPin, Calendar, 
  Tag, Compass, Phone, User, QrCode, ClipboardList, Info, X, Check, Eye
} from 'lucide-react';

const CATEGORIES = [
  'ID Card', 'Mobile Phone', 'Wallet', 'Keys', 'Earbuds', 
  'Book', 'Water Bottle', 'Bag', 'Other'
];

const LOCATIONS = [
  'Main Gate', 'Library', 'Canteen', 'Computer Lab', 'Auditorium', 
  'Parking Area', 'Hostel', 'Sports Ground', 'Classroom Block', 
  'Administrative Block', 'Other'
];

export default function BrowseItems({ mode = 'lost' }) { // 'lost' | 'found'
  const { user, loginWithGoogle } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Details Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [claimStatus, setClaimStatus] = useState({ type: '', text: '' });
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (location) queryParams.append('location', location);
      if (date) queryParams.append('date', date);

      const endpoint = mode === 'lost' 
        ? `http://localhost:5000/api/lost-items?${queryParams.toString()}`
        : `http://localhost:5000/api/found-items?${queryParams.toString()}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [mode, search, category, location, date]);

  // Load details / QR code when item is selected
  const handleViewDetails = async (item) => {
    setSelectedItem(item);
    setClaimStatus({ type: '', text: '' });
    try {
      const res = await fetch(`http://localhost:5000/api/items/qr/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        setQrCodeUrl(data.qrCodeUrl);
      }
    } catch (err) {
      console.error('QR code fetch failed:', err);
    }
  };

  const handleClaim = async () => {
    if (!user) {
      setClaimStatus({ type: 'error', text: 'You must sign in to claim this item.' });
      loginWithGoogle();
      return;
    }

    if (user.uid === selectedItem.reporterId) {
      setClaimStatus({ type: 'error', text: 'You cannot claim an item you reported yourself.' });
      return;
    }

    setSubmittingClaim(true);
    setClaimStatus({ type: '', text: '' });

    try {
      // Find corresponding lost item if any, or just file standard claim
      const res = await fetch('http://localhost:5000/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lostItemId: '', // filled if matched
          foundItemId: selectedItem.id,
          claimantId: user.uid,
          finderId: selectedItem.reporterId
        })
      });

      if (res.ok) {
        setClaimStatus({ 
          type: 'success', 
          text: 'Claim request submitted! The finder has been notified on their dashboard.' 
        });
        
        // Refresh catalog list
        fetchItems();
        // Update selected item status locally
        setSelectedItem({ ...selectedItem, status: 'Claimed' });
      } else {
        const errData = await res.json();
        setClaimStatus({ type: 'error', text: errData.error || 'Failed to submit claim.' });
      }
    } catch (err) {
      console.error(err);
      setClaimStatus({ type: 'error', text: 'Server connection error.' });
    } finally {
      setSubmittingClaim(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setLocation('');
    setDate('');
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:px-12 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white font-heading">
          {mode === 'lost' ? 'Missing Belongings Catalog' : 'Found Items Inventory'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {mode === 'lost' 
            ? 'Browse items reported lost by other students. Click details to check matching logs.' 
            : 'View items collected around the campus. Claim yours by clicking "View Details".'}
        </p>
      </div>

      {/* Filters Area */}
      <div className="glass-panel p-6 rounded-2xl border border-white/20 dark:border-white/5 mb-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, tags..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* Category */}
          <div className="relative">
            <Tag className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-200 appearance-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Location */}
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-200 appearance-none"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          {/* Date */}
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Clear & Grid Toggle */}
        <div className="flex items-center justify-between border-t border-slate-200/40 dark:border-white/5 pt-4 mt-2">
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Clear Filters
          </button>
          
          {/* Grid/List views */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Catalog items */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/20 dark:border-white/5">
          <Info size={40} className="mx-auto text-slate-400 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">
            {mode === 'lost' ? 'No lost items reported yet.' : 'No found items reported yet.'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
            Try adjusting search keywords or checking back later.
          </p>
        </div>
      ) : (
        <motion.div 
          layout
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }
        >
          {items.map((item) => (
            <motion.div
              layout
              key={item.id}
              className={`glass-panel hover-card-trigger border border-white/20 dark:border-white/5 overflow-hidden flex ${
                viewMode === 'grid' ? 'flex-col rounded-2xl' : 'flex-row items-center p-4 rounded-xl gap-6'
              }`}
            >
              {/* Image box */}
              <div className={`${viewMode === 'grid' ? 'w-full h-48' : 'w-24 h-24 shrink-0 rounded-lg'} bg-slate-100 dark:bg-slate-800 overflow-hidden relative`}>
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:5000${item.imageUrl}`} 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-200/50 dark:bg-slate-800/50">
                    No Photo
                  </div>
                )}
                {/* Status tag */}
                <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${
                  item.status === 'Lost' || item.status === 'Claimed'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}>
                  {item.status}
                </span>
              </div>

              {/* Text content */}
              <div className={`p-5 flex-1 min-w-0 flex flex-col justify-between ${viewMode === 'grid' ? '' : 'h-24 py-1'}`}>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white truncate font-heading group-hover:text-brand-600 transition-colors">
                    {item.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                    <Tag size={10} /> {item.category}
                  </span>
                  
                  {viewMode === 'grid' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-3 mb-4 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 border-t border-slate-200/30 dark:border-white/5 pt-3 text-[11px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="text-slate-400" />
                    {mode === 'lost' ? item.lastSeenLocation : item.locationFound}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400" />
                    {mode === 'lost' ? item.dateLost : item.dateFound}
                  </span>
                </div>

                <button
                  onClick={() => handleViewDetails(item)}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Eye size={14} /> View Details
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Details drawer/modal overlay */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl p-6 glass-panel rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Visual Area */}
                <div className="space-y-4">
                  <div className="w-full h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200/50 dark:border-white/5">
                    {selectedItem.imageUrl ? (
                      <img src={selectedItem.imageUrl.startsWith('http') ? selectedItem.imageUrl : `http://localhost:5000${selectedItem.imageUrl}`} alt={selectedItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-200/50 dark:bg-slate-800/50">No Photo</div>
                    )}
                  </div>

                  {/* QR Code section */}
                  {qrCodeUrl && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/30 dark:border-white/5">
                      <img src={qrCodeUrl} alt="Report QR Code" className="w-16 h-16 rounded bg-white p-1 shrink-0 border border-slate-200" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <QrCode size={12} /> Scan QR Code
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          Scan to share or bookmark this item detail view on a mobile device.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="flex flex-col justify-between text-left space-y-4">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedItem.category}
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-heading">
                      {selectedItem.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold bg-white/30 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-200/40 dark:border-white/5">
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Info table */}
                  <div className="space-y-2 border-t border-b border-slate-200/40 dark:border-white/5 py-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Compass size={14} /> Location</span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold">{mode === 'lost' ? selectedItem.lastSeenLocation : selectedItem.locationFound}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Calendar size={14} /> Date Reported</span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold">{mode === 'lost' ? selectedItem.dateLost : selectedItem.dateFound}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold flex items-center gap-1.5"><User size={14} /> Reporter Email</span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold text-xs">{selectedItem.reporterEmail || selectedItem.reporterId}</span>
                    </div>
                    {mode === 'lost' && selectedItem.contactNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Phone size={14} /> Contact Number</span>
                        <span className="text-slate-700 dark:text-slate-200 font-bold">{selectedItem.contactNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Status & Claim Alerts */}
                  {claimStatus.text && (
                    <div className={`p-3 rounded-xl flex gap-2 text-xs leading-normal ${
                      claimStatus.type === 'success' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    }`}>
                      {claimStatus.type === 'success' ? <Check className="shrink-0" size={14} /> : <Info className="shrink-0" size={14} />}
                      <span>{claimStatus.text}</span>
                    </div>
                  )}

                  {/* Claim Button (For found items only) */}
                  {mode === 'found' && (
                    <button
                      onClick={handleClaim}
                      disabled={selectedItem.status !== 'Found' || submittingClaim}
                      className={`w-full py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all ${
                        selectedItem.status === 'Found'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25 hover:scale-[1.01]'
                          : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {submittingClaim 
                        ? 'Filing Claim...' 
                        : selectedItem.status === 'Claimed' 
                          ? 'Claim Requested' 
                          : selectedItem.status === 'Returned' 
                            ? 'Already Returned' 
                            : 'Claim Item'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
