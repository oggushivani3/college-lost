import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Sync user profile with Backend database
  const syncUserWithBackend = async (userData) => {
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
          photoURL: userData.photoURL
        })
      });
      if (res.ok) {
        const synced = await res.json();
        const merged = { ...userData, ...synced };
        setUser(merged);
        localStorage.setItem('portal_user', JSON.stringify(merged));
      } else {
        setUser(userData);
        localStorage.setItem('portal_user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('Backend sync failed, using client-only state:', err);
      setUser(userData);
      localStorage.setItem('portal_user', JSON.stringify(userData));
    }
  };

  // Check authentication state on mount
  useEffect(() => {
    // If Firebase Auth is not configured, load user from local storage
    if (!auth) {
      const savedUser = localStorage.getItem('portal_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.uid && !parsed.uid.startsWith('mock-')) {
          setUser(parsed);
        } else {
          localStorage.removeItem('portal_user');
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`
        };
        await syncUserWithBackend(userData);
      } else {
        setUser(null);
        localStorage.removeItem('portal_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update points/info reactively by fetching user details from backend
  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.uid}/dashboard`);
      if (res.ok) {
        const usersRes = await fetch('http://localhost:5000/api/users/leaderboard');
        if (usersRes.ok) {
          const leaderboard = await usersRes.json();
          const dbUser = leaderboard.find(u => u.uid === user.uid);
          if (dbUser) {
            const updated = { ...user, points: dbUser.points, role: dbUser.role };
            setUser(updated);
            localStorage.setItem('portal_user', JSON.stringify(updated));
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync user details:', err);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      setShowSetupModal(true);
      return;
    }
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Firebase Sign-Out failed:', err);
    }
    setUser(null);
    localStorage.removeItem('portal_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser, syncUserWithBackend }}>
      {children}
      
      {/* Firebase Setup Warning Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 glass-panel rounded-2xl border border-white/20 shadow-2xl text-left dark:text-white">
            <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white mb-2 font-heading">
              Firebase Configuration Required
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Real Google Sign-In is enabled, but the credentials in <code>frontend/.env</code> have not been configured yet.
            </p>
            
            <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm bg-white/30 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-white/5">
              <p className="font-semibold text-slate-800 dark:text-white">To setup real Google Authentication:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Create a Firebase Project in the Firebase Console.</li>
                <li>Enable **Google Sign-In** in the Authentication settings.</li>
                <li>Go to Project Settings, add a Web App, and copy the config values.</li>
                <li>Paste them into your <code>frontend/.env</code> file.</li>
                <li>Restart the dev server using <code>npm start</code>.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowSetupModal(false)}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold transition-all duration-200 text-center shadow-lg hover:shadow-blue-500/20"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
