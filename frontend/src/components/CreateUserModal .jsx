import React, { useState } from 'react';

const CreateUserModal = ({ onClose, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('superadmin');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = { username, email, password, role , address };

    try {
      // Call the onSubmit function (which should make the API request)
      await onSubmit(userData);

      // If the request succeeds, show a success popup
      setPopupMessage('User added successfully!');
      setIsError(false);
      setShowPopup(true);

      // Close the modal after 2 seconds
      setTimeout(() => {
        setShowPopup(false);
        onClose();
      }, 2000);
    } catch (err) {
      // If the request fails, show an error popup
      setPopupMessage('Failed to create user. Please try again.');
      setIsError(true);
      setShowPopup(true);

      // Hide the popup after 2 seconds but keep the modal open
      setTimeout(() => {
        setShowPopup(false);
      }, 2000);
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create User</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="new-username"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="new-email"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  type="text"
                  className="form-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {/* <option value="admin">Admin</option> */}
                  <option value="superadmin">Super Admin</option>
                  {/* <option value="frontoffice">Front Office</option> */}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Create
              </button>
            </form>
            {showPopup && (
              <div className={`alert ${isError ? 'alert-danger' : 'alert-success'} mt-3`}>
                {popupMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;