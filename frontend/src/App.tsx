import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SamplesPage } from './pages/SamplesPage';
import { SampleDetailPage } from './pages/SampleDetailPage';
import { EquipmentPage } from './pages/EquipmentPage';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const handleNavigate = (page: string, sampleId?: string) => {
    if (sampleId) {
      setSelectedSampleId(sampleId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => handleNavigate('dashboard')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === 'dashboard' && (
          <ProtectedRoute onRedirectToLogin={() => setCurrentPage('login')}>
            <DashboardPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        )}

        {currentPage === 'samples' && (
          <ProtectedRoute onRedirectToLogin={() => setCurrentPage('login')}>
            <SamplesPage
              onNavigateToDetail={(id) => handleNavigate('sample-detail', id)}
            />
          </ProtectedRoute>
        )}

        {currentPage === 'sample-detail' && selectedSampleId && (
          <ProtectedRoute onRedirectToLogin={() => setCurrentPage('login')}>
            <SampleDetailPage
              sampleId={selectedSampleId}
              onBack={() => handleNavigate('samples')}
            />
          </ProtectedRoute>
        )}

        {currentPage === 'equipment' && (
          <ProtectedRoute onRedirectToLogin={() => setCurrentPage('login')}>
            <EquipmentPage />
          </ProtectedRoute>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            LabAudit &copy; 2026 &middot; LIMS-inspired Sample & Calibration Management System &middot; ISO 17025 Compliance
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
