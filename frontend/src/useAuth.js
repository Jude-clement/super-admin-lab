import { useState, useEffect } from 'react';
import api from './api'; // Import the Axios instance

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/profile'); // Fetch user profile
        if (response.data.success) {
          setUser(response.data.user);
          setRoles(response.data.roles);
          setPermissions(response.data.permissions);
        }
      } catch (err) {
        console.error('Failed to fetch user data', err);
      }
    };

    fetchUser();
  }, []);

  return { user, roles, permissions };
};

export default useAuth;