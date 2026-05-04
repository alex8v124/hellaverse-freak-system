import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CharacterRequest } from './pages/CharacterRequest';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { SetupAdmin } from './pages/SetupAdmin';
import { Profile } from './pages/Profile';

const PrivateRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && profile?.role !== 'Admin') return <Navigate to="/" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[var(--color-bg-dark)] font-sans">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/request/:id" element={<CharacterRequest />} />
              <Route path="/login" element={<Login />} />
              <Route path="/setup-admin-secret-99" element={<SetupAdmin />} />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <PrivateRoute adminOnly>
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="mt-20 py-8 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em]">
              Hazbin Roleplay Hub &copy; {new Date().getFullYear()} • Minimalist Neon Edition
            </p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
