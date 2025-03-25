import React, { useState } from 'react';

const DeleteUserModal = ({ user, onClose, onDelete }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleDelete = async () => {
    try {
      await onDelete(); // Call the onDelete function
      setPopupMessage('User deleted successfully!');
      setIsError(false);
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        onClose(); // Close the modal after 2 seconds
      }, 2000);
    } catch (err) {
      setPopupMessage('Failed to delete user. Please try again.');
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
            <h5 className="modal-title">Delete User</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete user <strong>{user.username}</strong>?</p>
            {showPopup && (
              <div className={`alert ${isError ? 'alert-danger' : 'alert-success'} mt-3`}>
                {popupMessage}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;