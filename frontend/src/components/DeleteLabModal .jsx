import React, { useState } from 'react';

const DeleteLabModal = ({ lab, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete lab');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Delete Lab</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <p>
              Are you sure you want to delete the lab <strong>{lab?.lab_name}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteLabModal;