import React, { useEffect, useState, Suspense } from 'react';
import api from '../api';

// Lazy load only the delete modal component
const DeleteLabModal = React.lazy(() => import('./DeleteLab'));

const Labs = ({ setActiveMenu, setSelectedLab }) => {
  const [labs, setLabs] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLabToDelete, setCurrentLabToDelete] = useState(null);

  // Status constants
  const LICENSE_STATUS = {
    DEACTIVATED: 0,
    ACTIVE: 1
  };

  // Fetch labs with their licenses from the backend
  const fetchLabs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/labs');
      if (response.data.result) {
        setLabs(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch labs. Please try again.');
      console.error('Failed to fetch labs', err);
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
    fetchLabs();
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

  // Handle delete lab (will cascade delete licenses)
  const handleDelete = async () => {
    if (!hasPermission('delete')) {
      setError('You do not have permission to delete labs.');
      return;
    }
    try {
      const response = await api.delete(`/labs/${currentLabToDelete.lab_id}`);
      if (response.data.result) {
        fetchLabs(); // Refresh the list
        setShowDeleteModal(false);
      } else {
        throw new Error(response.data.message || 'Failed to delete lab.');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete lab.');
    }
  };

  // Handle license activation
  const handleActivateLicense = async (licenseId) => {
    if (!hasPermission('update')) {
      alert('You do not have permission to activate licenses.');
      return;
    }
    try {
      await api.post(`/licenses/${licenseId}/activate`);
      fetchLabs(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate license.');
    }
  };

  // Handle license deactivation
  const handleDeactivateLicense = async (licenseId) => {
    if (!hasPermission('update')) {
      alert('You do not have permission to deactivate licenses.');
      return;
    }
    try {
      await api.post(`/licenses/${licenseId}/deactivate`);
      fetchLabs(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate license.');
    }
  };

  // Format date to a readable string with IST timezone
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Check if license is currently active based on dates
  const isLicenseCurrentlyActive = (license) => {
    if (!license) return false;
    const now = new Date();
    const issued = new Date(license.issued_date);
    const expiry = new Date(license.expiry_date);
    return now >= issued && now <= expiry;
  };

  // Get comprehensive status display info for a lab
  const getLabStatusDisplay = (lab) => {
    const license = lab.licenses?.[0];
    if (!license) return {
      text: 'No License',
      badgeClass: 'bg-secondary',
      tooltip: 'This lab has no associated license'
    };

    // const isActive = license.status === LICENSE_STATUS.ACTIVE;
    // const isValidPeriod = isLicenseCurrentlyActive(license);
    // const isActuallyActive = isActive && isValidPeriod;
    
  return {
    text: license.status === LICENSE_STATUS.ACTIVE ? 'Active' : 'Inactive',
    badgeClass: license.status === LICENSE_STATUS.ACTIVE ? 'bg-success' : 'bg-warning',
    tooltip: `Status: ${license.status === LICENSE_STATUS.ACTIVE ? 'ACTIVE' : 'INACTIVE'}\n` +
           `Issued: ${formatDate(license.issued_date)}\n` +
           `Expires: ${formatDate(license.expiry_date)}`
  };
};

  if (loading) {
    return <div className="text-center py-4">Loading labs...</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        
        {hasPermission('add') && (
          <button 
            className="btn btn-primary mb-3" 
            onClick={() => setActiveMenu('labs/create')}
          >
            Create Lab with License
          </button>
        )}

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>ID</th>
                <th style={{ textAlign: 'center' }}>Lab Name</th>
                <th style={{ textAlign: 'center' }}>Contact Info</th>
                <th style={{ textAlign: 'center' }}>Address</th>
                <th style={{ textAlign: 'center' }}>License Status</th>
                <th style={{ textAlign: 'center' }}>License Token</th>
                <th style={{ textAlign: 'center' }}>Issued Date</th>
                <th style={{ textAlign: 'center' }}>Expiry Date</th>
                {hasTableActionPermissions() && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {labs.length > 0 ? (
                labs.map((lab) => {
                  const status = getLabStatusDisplay(lab);
                  const license = lab.licenses?.[0];
                  return (
                    <tr key={lab.lab_id}>
                      <td style={{ textAlign: 'center' }}>{lab.lab_id}</td>
                      <td style={{ textAlign: 'center' }}>{lab.lab_name}</td>
                      <td style={{ textAlign: 'center' }}>
                        {lab.contact_person}<br/>
                        {lab.contact_email}<br/>
                        {lab.contact_phone}
                      </td>
                      <td style={{ textAlign: 'center' }}>{lab.address}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span 
                          className={`badge ${status.badgeClass}`}
                          title={status.tooltip}
                          style={{ cursor: 'help' }}
                        >
                          {status.text}
                        </span>
                        {/* {license && (
                          <button 
                            className="btn btn-link btn-sm"
                            onClick={() => syncLicenseStatus(license.license_id)}
                            title="Sync with current time"
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                        )} */}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {license?.license_key
                          ? license.license_key.length > 10
                            ? license.license_key.slice(0, 10) + '...'
                            : license.license_key
                          : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {license?.issued_date ? formatDate(license.issued_date) : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {license?.expiry_date ? formatDate(license.expiry_date) : 'N/A'}
                      </td>
                      {hasTableActionPermissions() && (
                        <td style={{ textAlign: 'center' }}>
                          {hasPermission('update') && (
                            <button
                              style={{ width: '58px', margin: '0 5px' }}
                              className="btn btn-warning btn-sm mb-1"
                              onClick={() => {
                                setSelectedLab(lab);
                                setActiveMenu('labs/edit');
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {hasPermission('delete') && (
                            <button
                              style={{ width: '58px', margin: '0 5px' }}
                              className="btn btn-danger btn-sm mb-1"
                              onClick={() => {
                                setCurrentLabToDelete(lab);
                                setShowDeleteModal(true);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={hasTableActionPermissions() ? 9 : 8} className="text-center">
                    No labs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Lab Modal */}
      {showDeleteModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <DeleteLabModal
            lab={currentLabToDelete}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDelete}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Labs;