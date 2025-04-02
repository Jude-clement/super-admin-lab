import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';import DataTable from './components/DataTable';
import Login from './components/Login';
import { AuthProvider } from './context/AuthContext'; // Import the AuthProvider
import Register from './components/register';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import ProtectedRoute from './components/ProtectedRoute';
import Labs from './components/Labs';
import Licenses from './components/Licenses';
import CreateLab from './components/CreateLab';

const RouteTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Restore the saved route on page load
  useEffect(() => {
    const savedRoute = localStorage.getItem('currentRoute');
    if (savedRoute && savedRoute !== location.pathname) {
      navigate(savedRoute); // Redirect to the saved route
    }
  }, []);

  // Save the current route to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentRoute', location.pathname);
  }, [location]);

  return null; // This component doesn't render anything
};


function App() {
  return (
    <AuthProvider>
    <Router>
    <RouteTracker /> {/* Add the RouteTracker component */}
      <Routes>
        <Route path="/" element={<ProtectedRoute><DataTable/></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register/>} />
        <Route  path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute> }/>
        <Route path="/manage-user" element={<ProtectedRoute><Users/></ProtectedRoute>} />
        <Route path="/labs" element={<ProtectedRoute><Labs/></ProtectedRoute>} />
        <Route path="licenses" element={<ProtectedRoute><Licenses/></ProtectedRoute>} />
        <Route path="/labs/create" element={<ProtectedRoute><CreateLab/></ProtectedRoute>} />
      </Routes>
    </Router>
</AuthProvider>
  );
}

export default App;

