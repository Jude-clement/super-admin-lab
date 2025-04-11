import React, { useState } from 'react';

const DeleteTicketModal = ({ ticket, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete ticket');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Delete Ticket</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <p>
              Are you sure you want to delete the ticket <strong>#{ticket?.id} - {ticket?.title}</strong>?
            </p>
            <div className="ticket-details">
              <p><strong>Status:</strong> {ticket?.status?.charAt(0).toUpperCase() + ticket?.status?.slice(1)}</p>
              <p><strong>Representer:</strong> {ticket?.representer_name}</p>
              <p><strong>Assignee:</strong> {ticket?.assignee || 'Not assigned'}</p>
              {ticket?.eta && <p><strong>ETA:</strong> {new Date(ticket.eta).toLocaleDateString()}</p>}
            </div>
            <p className="text-danger mt-3">
              <strong>Warning:</strong> This action cannot be undone and will permanently delete the ticket.
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
              {isDeleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                'Delete Ticket'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteTicketModal;