import React, { useState, useEffect } from 'react';
import FormularioPago from './FormularioPago';
import AdminDashboard from './AdminDashboard';

function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.hash === '#admin');

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminRoute(window.location.hash === '#admin');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {isAdminRoute ? (
        <AdminDashboard />
      ) : (
        <FormularioPago />
      )}
    </div>
  );
}

export default App;