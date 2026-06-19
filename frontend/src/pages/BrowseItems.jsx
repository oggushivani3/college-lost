import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Grid, List, MapPin, Calendar, 
  Tag, Compass, Phone, User, QrCode, ClipboardList, Info, X, Check, Eye,
  MessageCircle, Send, Loader2
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

// ── Comment Chat Panel ────────────────────────────────────────────────────────
function CommentChat({ itemId, user, loginWithGoogle, reporterId, finderId }) {
  const [comments, setComments]   = useState([]);
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  const fetchComments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/items/${itemId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    setLoadingComments(true);
    setComments([]);
    fetchComments();

    // Poll for new messages every 10 seconds
    pollRef.current = setInterval(fetchComments, 10000);
    return () => clearInterval(pollRef.current);
  }, [itemId]);

  // Scroll to bottom whenever comments change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    if (!user) { loginWithGoogle(); return; }
    // Allow only reporter or finder to send messages
    if (user.uid !== reporterId && user.uid !== finderId) {
      setSending(false);
      alert('Only the reporter or the finder can chat about this item.');
      return;
    }
    const trimmed = message.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const res = await fetch(`http://localhost:5000/api/items/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:       user.uid,
          userName:     user.name || user.email,
          userPhotoURL: user.photoURL || '',
          message:      trimmed
        })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setMessage('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
           ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200/40 dark:border-white/5">
        <MessageCircle size={15} className="text-brand-500" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          Item Chat
        </span>
        <span className="ml-auto text-[10px] text-slate-400 font-medium">
          Chat to coordinate return
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0" style={{ maxHeight: '220px' }}>
        {loadingComments ? (
          <div className="flex items-center justify-center h-20 text-slate-400">
            <Loader2 size={18} className="animate-spin mr-2" />
            <span className="text-xs">Loading messages…</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-slate-400 text-center">
            <MessageCircle size={22} className="mb-1 opacity-40" />
            <p className="text-xs">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((c) => {
            const isMe = user && c.userId === user.uid;
            return (
              <div
                key={c.id}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full shrink-0 overflow-hidden border-2 border-white/30 dark:border-white/10 shadow-sm bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-[10px] font-bold"
                >
                  {c.userPhotoURL ? (
                    <img src={c.userPhotoURL} alt={c.userName} className="w-full h-full object-cover" />
                  ) : (
                    (c.userName || 'U').charAt(0).toUpperCase()
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && (
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5 ml-1">
                      {c.userName}
                    </span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-tr-sm'
                        : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-200/50 dark:border-white/5'
                    }`}
                  >
                    {c.message}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 mx-1">
                    {formatTime(c.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="mt-3 pt-3 border-t border-slate-200/40 dark:border-white/5">
        {!user ? (
          <button
            onClick={loginWithGoogle}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <User size={13} /> Sign in to chat
          </button>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about item location, handover…"
              className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400 leading-relaxed"
              style={{ minHeight: '38px', maxHeight: '80px' }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main BrowseItems Component ────────────────────────────────────────────────
export default function BrowseItems() { // only lost items mode
  const mode = 'lost';
  const { user, loginWithGoogle } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  
  // Search & Filter state
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate]         = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Details Modal state
  const [selectedItem, setSelectedItem]   = useState(null);
  const [qrCodeUrl, setQrCodeUrl]         = useState('');
  const [claimStatus, setClaimStatus]     = useState({ type: '', text: '' });
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Chat panel tab inside modal
  const [detailTab, setDetailTab] = useState('info'); // 'info' | 'chat'

  const fetchItems = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search)   queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (location) queryParams.append('location', location);
      if (date)     queryParams.append('date', date);

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
    setDetailTab('info');
    setQrCodeUrl('');
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
      const res = await fetch('http://localhost:5000/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lostItemId: '',
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
        fetchItems();
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
  }

  // Mark item as found and open chat with reporter
  const handleFound = async () => {
    if (!user) {
      loginWithGoogle();
      return;
    }
    if (!selectedItem) return;
    try {
      const res = await fetch(`http://localhost:5000/api/lost-items/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Found', finderId: user.uid })
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setSelectedItem({ ...selectedItem, status: 'Found', finderId: user.uid });
        setDetailTab('chat');
        fetchItems();
      } else {
        console.error('Failed to mark item as found');
      }
    } catch (err) {
      console.error(err);
    }
  };;

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

      {/* ── Details Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl glass-panel rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden"
              style={{ maxHeight: '90vh' }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Tab bar */}
              <div className="flex gap-1 p-4 pb-0">
                <button
                  onClick={() => setDetailTab('info')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                    detailTab === 'info'
                      ? 'text-brand-600 dark:text-brand-400 border-brand-500 bg-white/30 dark:bg-slate-900/30'
                      : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Info size={13} /> Item Details
                </button>
                <button
                  onClick={() => setDetailTab('chat')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                    detailTab === 'chat'
                      ? 'text-brand-600 dark:text-brand-400 border-brand-500 bg-white/30 dark:bg-slate-900/30'
                      : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <MessageCircle size={13} /> Chat with Reporter
                </button>
              </div>

              {/* Modal content */}
              <div className="overflow-y-auto p-6 pt-4" style={{ maxHeight: 'calc(90vh - 56px)' }}>
                {/* ── Info Tab ── */}
                {detailTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    {/* Visual Area */}
                    <div className="space-y-4">
                      <div className="w-full h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200/50 dark:border-white/5">
                        {selectedItem.imageUrl ? (
                          <img 
                            src={selectedItem.imageUrl.startsWith('http') ? selectedItem.imageUrl : `http://localhost:5000${selectedItem.imageUrl}`} 
                            alt={selectedItem.name} 
                            className="w-full h-full object-cover" 
                          />
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

                      {/* Found button for non-reporter */}
                      {user && user.uid !== selectedItem.reporterId && selectedItem.status === 'Lost' && (
                        <button
                          onClick={handleFound}
                          className="w-full py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all mb-2"
                        >
                          <Check size={14} /> I found this item
                        </button>
                      )}
                      {/* Found button for reporter */}
                      {user && user.uid === selectedItem.reporterId && selectedItem.status === 'Lost' && (
                        <button
                          onClick={handleFound}
                          className="w-full py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 transition-all mb-2"
                        >
                          <Check size={14} /> I have recovered this item
                        </button>
                      )}
                      {/* Chat CTA */}
                      <button
                        onClick={() => setDetailTab('chat')}
                        className="w-full py-2.5 rounded-xl border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <MessageCircle size={14} /> Chat with Reporter
                      </button>
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
                    </div>
                  </div>
                )}

                {/* ── Chat Tab ── */}
                {detailTab === 'chat' && (
                  <div className="mt-2">
                    {/* Reporter info banner */}
                    <div className="mb-4 p-3 rounded-xl bg-white/30 dark:bg-slate-900/30 border border-slate-200/40 dark:border-white/5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(selectedItem.reporterEmail || selectedItem.reporterId || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Chatting about</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedItem.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Reporter: {selectedItem.reporterEmail || selectedItem.reporterId}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          selectedItem.status === 'Lost' || selectedItem.status === 'Claimed'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}>
                          {selectedItem.status}
                        </span>
                      </div>
                    </div>

                    <CommentChat 
                      itemId={selectedItem.id} 
                      user={user} 
                      loginWithGoogle={loginWithGoogle}
                      reporterId={selectedItem.reporterId}
                      finderId={selectedItem.finderId || ''}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
