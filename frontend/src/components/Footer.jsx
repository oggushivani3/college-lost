import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Brand / Logo Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/vignan_logo.png"
              alt="Vignan Institute Logo"
              className="w-10 h-10 rounded-full object-cover border border-brand-500/20 bg-white"
            />
            <div>
              <span className="font-heading font-bold text-slate-800 dark:text-white text-sm block leading-tight">
                Vignan Institute
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                of Technology & Science
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
            A premier JNTUH affiliated engineering college committed to academic excellence and holistic development.
          </p>
          <div className="flex gap-2 mt-1">
            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">NAAC Accredited</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">JNTUH</span>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Contact & Location</h4>
          <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">📍</span>
              <span className="leading-relaxed">Vignan Institute of Technology and Science, Deshmukhi Village, Pochampally Mandal, Nalgonda District, Telangana — 508 284</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">🌐</span>
              <a href="https://vignanits.ac.in/" target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors underline underline-offset-2">
                vignanits.ac.in
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200/40 dark:border-white/5 py-5 px-6 md:px-12 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
          © {new Date().getFullYear()} Vignan Institute of Technology and Science. All rights reserved.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center font-semibold">
          Built by oggushivani
        </p>
      </div>
    </footer>
  );
}
