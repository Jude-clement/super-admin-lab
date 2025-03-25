import React, { useEffect, useState } from 'react';
import api from '../api'; // Import the Axios instance

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Loading state

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data.success) {
        setProfile(response.data.user);
        setRoles(response.data.roles);
        setPermissions(response.data.permissions);
      }
    } catch (err) {
      setError('Failed to fetch profile. Please try again.');
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false); // Set loading to false once the request is completed
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '20px',
        padding: '30px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'white',
        transition: 'box-shadow 0.3s ease-in-out',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)')}
    >
      {error && (
        <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: 'auto' }}></div>
        </div>
      ) : (
        profile && (
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '36px', color: '#333' }}>Hello {profile.username}!</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#555' }}>
              <strong>Email : </strong> {profile.email}
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default Dashboard;
