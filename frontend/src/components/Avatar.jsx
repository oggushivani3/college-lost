import React, { useState, useEffect } from 'react';

export default function Avatar({ src, name, className = "w-9 h-9" }) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if the src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const getInitials = (nameStr) => {
    if (!nameStr) return '?';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.trim().slice(0, 2).toUpperCase();
  };

  const getGradientClass = (nameStr) => {
    const colors = [
      'from-pink-500 to-rose-500',
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
      'from-teal-500 to-emerald-500',
      'from-emerald-500 to-green-500',
      'from-amber-500 to-orange-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-violet-500',
    ];
    if (!nameStr) return colors[0];
    let hash = 0;
    for (let i = 0; i < nameStr.length; i++) {
      hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name || 'User Avatar'}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`${className} rounded-full object-cover border border-slate-200 dark:border-white/10`}
      />
    );
  }

  // Fallback: styled initials with a name-specific gradient background
  const initials = getInitials(name);
  const gradient = getGradientClass(name);

  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold tracking-wider select-none border border-slate-200 dark:border-white/10`}
      title={name}
    >
      <span className="text-[38%] uppercase leading-none">{initials}</span>
    </div>
  );
}
