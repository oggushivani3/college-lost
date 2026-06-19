import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Upload, Check, AlertCircle, Sparkles, MapPin, Calendar, Tag } from 'lucide-react';

const CATEGORIES = [
  'ID Card', 'Mobile Phone', 'Wallet', 'Keys', 'Earbuds', 
  'Book', 'Water Bottle', 'Bag', 'Other'
];

const LOCATIONS = [
  'Main Gate', 'Library', 'Canteen', 'Computer Lab', 'Auditorium', 
  'Parking Area', 'Hostel', 'Sports Ground', 'Classroom Block', 
  'Administrative Block', 'Other'
];

export default function ReportItem({ type = 'lost', onReportSuccess }) {
  const { user, loginWithGoogle } = useAuth();
  const [formType, setFormType] = useState(type); // 'lost' | 'found'
  
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Statuses
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    setFormType(type);
  }, [type]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return '';
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.imageUrl;
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setStatusMsg({ type: 'error', text: 'You must be signed in to submit reports.' });
      loginWithGoogle();
      return;
    }

    if (!name || !category || !description || !location || !date) {
      setStatusMsg({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const uploadedUrl = await uploadImage();

      const payload = {
        name,
        category,
        description,
        reporterId: user.uid,
        imageUrl: uploadedUrl
      };

      let endpoint = '';
      if (formType === 'lost') {
        endpoint = 'http://localhost:5000/api/lost-items';
        payload.lastSeenLocation = location;
        payload.dateLost = date;
        payload.contactNumber = contactNumber;
      } else {
        endpoint = 'http://localhost:5000/api/found-items';
        payload.locationFound = location;
        payload.dateFound = date;
        payload.additionalNotes = additionalNotes;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMsg({ 
          type: 'success', 
          text: `Report submitted successfully! AI is currently scanning for matches...` 
        });
        
        // Reset form
        setName('');
        setCategory('');
        setDescription('');
        setLocation('');
        setDate('');
        setContactNumber('');
        setAdditionalNotes('');
        setImageFile(null);
        setImagePreview(null);

        if (onReportSuccess) {
          setTimeout(() => onReportSuccess(formType), 2000);
        }
      } else {
        const errData = await res.json();
        setStatusMsg({ type: 'error', text: errData.error || 'Failed to submit report.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Server connection error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 md:px-8 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 md:p-8 rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl"
      >
        {/* Dual Tab Buttons */}
        <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-2xl mb-8">
          <button
            onClick={() => { setFormType('lost'); setStatusMsg({ type: '', text: '' }); }}
            className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all duration-200 ${
              formType === 'lost'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Report Lost Item
          </button>
          <button
            onClick={() => { setFormType('found'); setStatusMsg({ type: '', text: '' }); }}
            className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all duration-200 ${
              formType === 'found'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Report Found Item
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-heading">
              {formType === 'lost' ? 'Lost Item Form' : 'Found Item Form'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide exact details to improve AI match precision.
            </p>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Sparkles size={12} /> AI Matching Active
          </span>
        </div>

        {/* Status Alerts */}
        {statusMsg.text && (
          <div className={`p-4 rounded-xl mb-6 flex gap-3 text-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/25 text-rose-700 dark:text-rose-300'
          }`}>
            {statusMsg.type === 'success' ? <Check className="shrink-0" /> : <AlertCircle className="shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-slate-700 dark:text-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Name */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Item Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Leather Tommy Hilfiger Wallet"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category *</label>
              <div className="relative">
                <Tag className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm appearance-none"
                  required
                >
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {formType === 'lost' ? 'Last Seen Location *' : 'Location Found *'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm appearance-none"
                  required
                >
                  <option value="" disabled>Select location</option>
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {formType === 'lost' ? 'Date Lost *' : 'Date Found *'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Detailed Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide serial numbers, stickers, colors, scratches, contents, brand, model to boost matching precision."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              required
            />
          </div>

          {/* Conditional Fields based on formType */}
          {formType === 'lost' ? (
            /* Contact Number (Optional) */
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Number (Optional)</label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          ) : (
            /* Additional Notes (Optional) */
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Additional Notes / Handover Spot (Optional)</label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Handed over to Library front desk assistant."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          )}

          {/* Upload Image Section */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Upload Image {formType === 'lost' ? '(Optional)' : '(Recommended)'}
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-white/10 bg-white/30 dark:bg-slate-900/30">
              <div className="flex flex-col items-center justify-center shrink-0 w-24 h-24 rounded-xl border border-slate-200/50 bg-white/50 dark:border-white/5 dark:bg-slate-800/50 overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="text-slate-400" size={28} />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Choose item photo</h4>
                <p className="text-xs text-slate-400">Supports PNG, JPG, JPEG up to 5MB.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-file-input"
                />
                <label
                  htmlFor="image-file-input"
                  className="inline-block mt-2 cursor-pointer px-4 py-2 border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-950/20 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  Browse Files
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 text-sm font-bold text-white rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.01] ${
              formType === 'lost'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-brand-500/25'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
            }`}
          >
            {submitting ? 'Submitting Report...' : formType === 'lost' ? 'Submit Lost Item Report' : 'Submit Found Item Report'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
