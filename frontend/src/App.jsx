import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MoodScanPage from './pages/MoodScanPage';
import DashboardPage from './pages/DashboardPage';
import RelaxPage from './pages/RelaxPage';
import FocusPage from './pages/FocusPage';
import JournalPage from './pages/JournalPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scan" element={<MoodScanPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/relax" element={<RelaxPage />} />
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
