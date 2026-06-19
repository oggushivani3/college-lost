import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, Menu, X, LogOut, ShieldAlert, Award, FileText } from 'lucide-react';
import Avatar from './Avatar';

export default function Navbar({ activePage, setActivePage }) {
  const { user, loginWithGoogle, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/notifications/${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNavClick = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const promises = notifications
        .filter(n => !n.read)
        .map(n => fetch(`http://localhost:5000/api/notifications/${n.id}/read`, { method: 'POST' }));
      await Promise.all(promises);
      // Refresh notifications locally
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'browse-lost', label: 'Browse Lost' },
    { id: 'browse-found', label: 'Browse Found' },
    { id: 'report-lost', label: 'Report Lost' },
    { id: 'report-found', label: 'Report Found' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-white/20 dark:border-white/5 py-4 px-6 md:px-12 flex items-center justify-between transition-all duration-300">
      {/* Logo & College Name */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('home')}>
        <img 
          src="/vignan_logo.png" 
          alt="Vignan Institute Logo" 
          className="w-10 h-10 rounded-full object-cover border-2 border-brand-500/30 bg-white p-0.5"
        />
        <div>
          <span className="font-heading text-base font-bold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-300 dark:to-indigo-400 bg-clip-text text-transparent leading-tight block">
            Vignan Institute
          </span>
          <span className="block text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold leading-none">
            Lost & Found Portal
          </span>
        </div>
      </div>

      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center gap-6">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => handleNavClick(link.id)}
            className={`text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${
              activePage === link.id
                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500 pb-1'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {link.label}
          </button>
        ))}

        {user && (
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${
              activePage === 'dashboard'
                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500 pb-1'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Dashboard
          </button>
        )}

        {user && user.role === 'admin' && (
          <button
            onClick={() => handleNavClick('admin')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all ${
              activePage === 'admin' ? 'ring-2 ring-rose-500/50' : ''
            }`}
          >
            <ShieldAlert size={14} />
            Admin Suite
          </button>
        )}
      </div>

      {/* Action Buttons (Right) */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/10 transition-all duration-200"
          title="Toggle Light/Dark Mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Icon (Authenticated only) */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                markAllAsRead();
              }}
              className="p-2 rounded-xl bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/10 transition-all duration-200 relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-rose-500 text-white rounded-full text-[9px] font-bold ring-2 ring-white dark:ring-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl border border-white/20 dark:border-white/5 shadow-2xl p-4 z-50 text-slate-800 dark:text-slate-100 max-h-96 overflow-y-auto">
                <h4 className="font-bold text-sm tracking-tight border-b border-slate-200/50 dark:border-white/5 pb-2 mb-2 flex items-center justify-between">
                  <span>Recent Notifications</span>
                  <span className="text-xs text-slate-400 font-normal">Auto-clears on read</span>
                </h4>
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No notifications yet</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setShowNotificationsDropdown(false);
                          setActivePage('dashboard');
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors ${
                          notif.read
                            ? 'border-transparent text-slate-500 dark:text-slate-400'
                            : 'border-brand-500/20 bg-brand-500/5 font-medium'
                        }`}
                      >
                        {notif.message}
                        <span className="block text-[9px] text-slate-400 mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Auth Button */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* User Info (Desktop) */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none">
                {user.name}
              </span>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1 mt-0.5 justify-end">
                <Award size={10} />
                {user.points || 0} pts
              </span>
            </div>
            {/* Profile Avatar */}
            <div onClick={() => handleNavClick('dashboard')} className="cursor-pointer hover:scale-105 transition-transform">
              <Avatar
                src={user.photoURL}
                name={user.name}
                className="w-9 h-9"
              />
            </div>
            {/* Logout */}
            <button
              onClick={logout}
              className="hidden md:flex p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
          >
            Google Sign-In
          </button>
        )}

        {/* Mobile Menu Icon */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 w-full glass-panel border-b border-white/20 dark:border-white/5 p-6 z-50 flex flex-col gap-4 shadow-2xl lg:hidden animate-slideDown">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full py-2.5 text-left text-sm font-semibold border-b border-slate-100 dark:border-white/5 transition-colors ${
                activePage === link.id
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {link.label}
            </button>
          ))}
          {user && (
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full py-2.5 text-left text-sm font-semibold border-b border-slate-100 dark:border-white/5 transition-colors ${
                activePage === 'dashboard'
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              My Dashboard
            </button>
          )}
          {user && user.role === 'admin' && (
            <button
              onClick={() => handleNavClick('admin')}
              className="w-full flex items-center gap-2 py-2.5 text-left text-sm font-semibold text-rose-600 dark:text-rose-400 border-b border-slate-100 dark:border-white/5"
            >
              <ShieldAlert size={16} />
              Admin Suite
            </button>
          )}

          {user ? (
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/5 text-sm font-semibold mt-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => {
                loginWithGoogle();
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold mt-2"
            >
              Google Sign-In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
