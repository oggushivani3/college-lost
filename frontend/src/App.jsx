import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ReportItem from './pages/ReportItem';
import BrowseItems from './pages/BrowseItems';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const [activePage, setActivePage] = useState('home');
  const [reportType, setReportType] = useState('lost');

  const handleSelectReportType = (type) => {
    setReportType(type);
  };

  const handleReportSuccess = (submittedType) => {
    // Navigate to browse page of the submitted report type after 2 seconds
    setActivePage(submittedType === 'lost' ? 'browse-lost' : 'browse-found');
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-[#fafbff] dark:bg-[#0b0f19]">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto py-6">
        {activePage === 'home' && (
          <Home 
            setActivePage={setActivePage} 
            onSelectReportType={handleSelectReportType} 
          />
        )}
        
        {activePage === 'report-lost' && (
          <ReportItem 
            type="lost" 
            onReportSuccess={handleReportSuccess} 
          />
        )}
        
        {activePage === 'report-found' && (
          <ReportItem 
            type="found" 
            onReportSuccess={handleReportSuccess} 
          />
        )}
        
        {activePage === 'browse-lost' && (
          <BrowseItems mode="lost" />
        )}
        
        {activePage === 'browse-found' && (
          <BrowseItems mode="found" />
        )}
        
        {activePage === 'dashboard' && (
          <Dashboard />
        )}
        
        {activePage === 'admin' && (
          <Admin />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
