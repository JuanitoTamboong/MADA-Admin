import React, { useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import './App.css';

function App() {
  // Set default to true so it opens AdminDashboard directly
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <div className="App">
      {isLoggedIn ? (
        <AdminDashboard />
      ) : (
        <AdminLogin onLogin={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;