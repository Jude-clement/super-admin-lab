import React, { useEffect, useState, Suspense } from 'react';
import api from '../api';

// Lazy load only the delete modal component
const DeleteTicketModal = React.lazy(() => import('./DeleteTicketModal'));

const Tickets = ({ setActiveMenu, setSelectedTicket }) => {
  const [tickets, setTickets] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTicketToDelete, setCurrentTicketToDelete] = useState(null);

  // Status constants
  const TICKET_STATUS = {
    OPEN: 'open',
    INPROGRESS: 'inprogress',
    CLOSED: 'closed'
  };

  // Fetch tickets from the backend
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tickets');
      if (response.data) {
        setTickets(response.data.data || response.data);
      }
    } catch (err) {
      setError('Failed to fetch tickets. Please try again.');
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile to get roles and permissions
  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data.success) {
        setPermissions(response.data.permissions);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchProfile();
  }, []);

  // Check if the user has a specific permission
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  // Check if the user has any table action permissions
  const hasTableActionPermissions = () => {
    return hasPermission('update') || hasPermission('delete');
  };

  // Handle delete ticket
  const handleDelete = async () => {
    if (!hasPermission('delete')) {
      setError('You do not have permission to delete tickets.');
      return;
    }
    try {
      const response = await api.delete(`/tickets/${currentTicketToDelete.id}`);
      if (response.data) {
        fetchTickets(); // Refresh the list
        setShowDeleteModal(false);
      } else {
        throw new Error(response.data.message || 'Failed to delete ticket.');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete ticket.');
    }
  };

  // Handle ticket status change
  const handleStatusChange = async (ticketId, newStatus) => {
    if (!hasPermission('update')) {
      alert('You do not have permission to update tickets.');
      return;
    }
    try {
      await api.put(`/tickets/${ticketId}`, { status: newStatus });
      fetchTickets(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket status.');
    }
  };

  // Format date to a readable string
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status display info for a ticket
  const getTicketStatusDisplay = (status) => {
    const statusMap = {
      [TICKET_STATUS.OPEN]: {
        text: 'Open',
        badgeClass: 'bg-secondary',
        tooltip: 'Ticket is open and awaiting action'
      },
      [TICKET_STATUS.INPROGRESS]: {
        text: 'In Progress',
        badgeClass: 'bg-primary',
        tooltip: 'Ticket is being worked on'
      },
      [TICKET_STATUS.CLOSED]: {
        text: 'Closed',
        badgeClass: 'bg-success',
        tooltip: 'Ticket has been resolved'
      }
    };
    return statusMap[status] || {
      text: 'Unknown',
      badgeClass: 'bg-warning',
      tooltip: 'Unknown ticket status'
    };
  };

  if (loading) {
    return <div className="text-center py-4">Loading tickets...</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        
        {hasPermission('add') && (
          <button 
            className="btn btn-primary mb-3" 
            onClick={() => setActiveMenu('tickets/create')}
          >
            Create New Ticket
          </button>
        )}

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>ID</th>
                <th style={{ textAlign: 'center' }}>Title</th>
                <th style={{ textAlign: 'center' }}>Description</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Assignee</th>
                <th style={{ textAlign: 'center' }}>Representer Info</th>
                <th style={{ textAlign: 'center' }}>ETA</th>
                <th style={{ textAlign: 'center' }}>Created At</th>
                {hasTableActionPermissions() && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {tickets.length > 0 ? (
                tickets.map((ticket) => {
                  const status = getTicketStatusDisplay(ticket.status);
                  return (
                    <tr key={ticket.id}>
                      <td style={{ textAlign: 'center' }}>{ticket.id}</td>
                      <td style={{ textAlign: 'center' }}>{ticket.title}</td>
                      <td style={{ textAlign: 'center', maxWidth: '200px' }} className="text-truncate">                        {ticket.description}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span 
                          className={`badge ${status.badgeClass}`}
                          title={status.tooltip}
                          style={{ cursor: 'help' }}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{ticket.assignee || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        {ticket.representer_name}<br/>
                        {ticket.representer_email}<br/>
                        {ticket.representer_phone}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {ticket.eta ? formatDate(ticket.eta) : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {formatDate(ticket.created_at)}
                      </td>
                      {hasTableActionPermissions() && (
                        <td style={{ textAlign: 'center' }}>
  {hasPermission('update') && (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <button
        style={{ width: '100%', maxWidth: '200px' }}
        className="btn btn-warning btn-sm"
        onClick={() => {
          setSelectedTicket(ticket);
          setActiveMenu('tickets/edit');
        }}
      >
        Edit
      </button>
      <div className="btn-group btn-group-sm" style={{ width: '100%', maxWidth: '200px' }}>
        <button
          className={`btn btn-sm ${ticket.status === TICKET_STATUS.OPEN ? 'btn-primary active' : 'btn-outline-primary'}`}
          onClick={() => handleStatusChange(ticket.id, TICKET_STATUS.OPEN)}
          title="Set to Open"
          style={{ flex: 1 }}
        >
          <i className="fas fa-file-alt fa-lg"></i>
        </button>
        <button
          className={`btn btn-sm ${ticket.status === TICKET_STATUS.INPROGRESS ? 'btn-info active' : 'btn-outline-info'}`}
          onClick={() => handleStatusChange(ticket.id, TICKET_STATUS.INPROGRESS)}
          title="Set to In Progress"
          style={{ flex: 1 }}
        >
          <i className="fas fa-spinner"></i>
        </button>
        <button
          className={`btn btn-sm ${ticket.status === TICKET_STATUS.CLOSED ? 'btn-success active' : 'btn-outline-success'}`}
          onClick={() => handleStatusChange(ticket.id, TICKET_STATUS.CLOSED)}
          title="Set to Closed"
          style={{ flex: 1 }}
        >
          <i className="fas fa-check"></i>
        </button>
      </div>
    </div>
  )}
  {hasPermission('delete') && (
    <div style={{ marginTop: '4px', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <button
        style={{ width: '100%', maxWidth: '200px' }}
        className="btn btn-danger btn-sm"
        onClick={() => {
          setCurrentTicketToDelete(ticket);
          setShowDeleteModal(true);
        }}
      >
        Delete
      </button>
    </div>
  )}
</td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={hasTableActionPermissions() ? 9 : 8} className="text-center">
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Ticket Modal */}
      {showDeleteModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <DeleteTicketModal
            ticket={currentTicketToDelete}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDelete}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Tickets;