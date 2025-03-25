import React, { useState, useEffect } from 'react';

const EditUserModal = ({ user, onClose, onSubmit }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [address, setAddress] = useState(user.address);
  const [role, setRole] = useState(user.roles[0]?.name || ' superadmin');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setUsername(user.username);
    setEmail(user.email);
    setRole(user.roles[0]?.name || 'superadmin');
    setAddress(user.address);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit({ username, email, role, address }); // Call the onSubmit function
      setPopupMessage('User updated successfully!');
      setIsError(false);
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        onClose();
      }, 2000); // Close modal after 2 seconds
    } catch (err) {
      setPopupMessage('Failed to update user. Please try again.');
      setIsError(true);
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 2000); // Keep modal open for retry
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit User</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
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
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                Save Changes
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

export default EditUserModal;