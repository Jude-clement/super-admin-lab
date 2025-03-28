import React, { useEffect, useState, Suspense } from 'react';
import api from '../api';
import { generateLicenseKey } from '../utils/licenseGenerator';

// Lazy load only the delete modal component
const DeleteLabModal = React.lazy(() => import('./DeleteLabModal '));

const Labs = ({ setActiveMenu, setSelectedLab }) => {
  const [labs, setLabs] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

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
      alert('You do not have permission to delete labs.');
      return;
    }
    try {
      const response = await api.delete(`/labs/${selectedLab.lab_id}`);
      if (response.data.result) {
        fetchLabs(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to delete lab.');
      }
    } catch (err) {
      throw err;
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

  // Format date to a readable string
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
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
                <th style={{ textAlign: 'center' }}>License Key</th>
                <th style={{ textAlign: 'center' }}>Expiry Date</th>
                <th style={{ textAlign: 'center' }}>Created At</th>
                {hasTableActionPermissions() && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {labs.length > 0 ? (
                labs.map((lab) => (
                  <React.Fragment key={lab.lab_id}>
                    <tr>
                      <td style={{ textAlign: 'center' }}>{lab.lab_id}</td>
                      <td style={{ textAlign: 'center' }}>{lab.lab_name}</td>
                      <td style={{ textAlign: 'center' }}>
                        {lab.contact_person}<br/>
                        {lab.contact_email}<br/>
                        {lab.contact_phone}
                      </td>
                      <td style={{ textAlign: 'center' }}>{lab.address}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${
                          lab.license_status === 'active' ? 'bg-success' : 
                          lab.license_status === 'expired' ? 'bg-danger' : 'bg-warning'
                        }`}>
                          {lab.license_status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {lab.licenses?.[0]?.license_key || 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {lab.licenses?.[0]?.expiry_date ? formatDate(lab.licenses[0].expiry_date) : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>{formatDate(lab.created_at)}</td>
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
                                setSelectedLab(lab);
                                setShowDeleteModal(true);
                              }}
                            >
                              Delete
                            </button>
                          )}
                          {hasPermission('update') && lab.licenses?.[0] && (
                            lab.licenses[0].status === 'active' ? (
                              <button
                                style={{ width: '90px', margin: '0 5px' }}
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDeactivateLicense(lab.licenses[0].license_id)}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                style={{ width: '90px', margin: '0 5px' }}
                                className="btn btn-success btn-sm"
                                onClick={() => handleActivateLicense(lab.licenses[0].license_id)}
                                disabled={lab.licenses[0].status === 'expired'}
                              >
                                Activate
                              </button>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  </React.Fragment>
                ))
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

      {/* Delete Lab Modal (only modal remaining) */}
      {showDeleteModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <DeleteLabModal
            lab={selectedLab}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDelete}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Labs;