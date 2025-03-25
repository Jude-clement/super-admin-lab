import React, { useState } from 'react';
import api from '../api'; // Import the Axios instance
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState(''); // State for address
  const [error, setError] = useState('');
  const { login } = useAuth(); // Use the login function from context
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Step 1: Register the user
      const response = await api.post('/register', { username, email, password, role: 'superadmin', address });
      console.log('Registration Response:', response.data); // Debug the response

      if (response.data.success) {
        // Step 2: Log in the user after successful registration
        console.log('Attempting to log in with:', { email, password }); // Debug the login data
        const loginResponse = await login(email, password); // Use the login function from AuthContext
        console.log('Login Response:', loginResponse); // Debug the response

        if (loginResponse.success) {
          navigate('/'); // Redirect to dashboard
        } else {
          setError('Auto-login failed after registration');
        }
      } else {
        setError('Registration failed');
      }
    } catch (err) {
      console.error('Registration or Login Error:', err.response?.data); // Debug the error response
      setError('Registration or login failed');
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <div className="card">
          <div className="card-body register-card-body">
            <p className="login-box-msg">Register a new membership</p>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <span className="fas fa-user"></span>
                  </div>
                </div>
              </div>
              <div className="input-group mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <span className="fas fa-envelope"></span>
                  </div>
                </div>
              </div>
                {/* Address Field */}
                <div className="input-group mb-3">
                <textarea
                  className="form-control"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3} // Adjust the number of rows as needed
                  required
                  style={{ resize: 'none' }} // Prevent resizing
                />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <span className="fas fa-map-marker-alt"></span>
                  </div>
                </div>
              </div>
              <div className="input-group mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <span className="fas fa-lock"></span>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-4">
                  <button type="submit" className="btn btn-primary btn-block">
                    Register
                  </button>
                </div>
              </div>
            </form>
            <p className="mt-3">
              Already an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;