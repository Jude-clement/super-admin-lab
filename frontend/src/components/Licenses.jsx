import React, { useEffect, useState, Suspense } from 'react';
import api from '../api';
import { useSearchParams } from 'react-router-dom';

// Lazy load the modal components
const CreateLicenseModal = React.lazy(() => import('./CreateLicenseModal'));
const EditLicenseModal = React.lazy(() => import('./EditLicenseModal'));
const DeleteLicenseModal = React.lazy(() => import('./DeleteLicenseModal'));

const Licenses = () => {
  const [licenses, setLicenses] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const labId = searchParams.get('lab_id');

  // Fetch licenses from the backend
  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const url = labId ? `/licenses?client_id=${labId}` : '/licenses';
      const response = await api.get(url);
      if (response.data.result) {
        setLicenses(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch licenses. Please try again.');
      console.error('Failed to fetch licenses', err);
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
    fetchLicenses();
    fetchProfile();
  }, [labId]);

  // Check if the user has a specific permission
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  // Check if the user has any table action permissions
  const hasTableActionPermissions = () => {
    return hasPermission('update') || hasPermission('delete');
  };

  // Handle create license
  const handleCreate = async (licenseData) => {
    if (!hasPermission('add')) {
      alert('You do not have permission to create licenses.');
      return;
    }
    try {
      const response = await api.post('/licenses', licenseData);
      if (response.data.result) {
        setLicenses([...licenses, response.data.data]);
        fetchLicenses(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to create license.');
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle edit license
  const handleEdit = async (licenseData) => {
    if (!hasPermission('update')) {
      alert('You do not have permission to edit licenses.');
      return;
    }
    if (!selectedLicense) return;
    try {
      const response = await api.put(`/licenses/${selectedLicense.license_id}`, licenseData);
      if (response.data.result) {
        const updatedLicenses = licenses.map((license) =>
          license.license_id === selectedLicense.license_id ? { ...license, ...response.data.data } : license
        );
        setLicenses(updatedLicenses);
        fetchLicenses(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to update license.');
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle delete license
  const handleDelete = async () => {
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete licenses.');
      return;
    }
    if (!selectedLicense) return;
    try {
      const response = await api.delete(`/licenses/${selectedLicense.license_id}`);
      if (response.data.result) {
        const updatedLicenses = licenses.filter((license) => license.license_id !== selectedLicense.license_id);
        setLicenses(updatedLicenses);
        fetchLicenses(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to delete license.');
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle activate license
  const handleActivate = async (licenseId) => {
    if (!hasPermission('update')) {
      alert('You do not have permission to activate licenses.');
      return;
    }
    try {
      const response = await api.post(`/licenses/${licenseId}/activate`);
      if (response.data.result) {
        fetchLicenses(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate license.');
    }
  };

  // Handle deactivate license
  const handleDeactivate = async (licenseId) => {
    if (!hasPermission('update')) {
      alert('You do not have permission to deactivate licenses.');
      return;
    }
    try {
      const response = await api.post(`/licenses/${licenseId}/deactivate`);
      if (response.data.result) {
        fetchLicenses(); // Refresh the list
      }
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
    return <div className="text-center py-4">Loading licenses...</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        
        {/* Show Create License button only if the user has permission */}
        {hasPermission('add') && (
          <button 
            className="btn btn-primary mb-3" 
            onClick={() => setShowCreateModal(true)}
          >
            Create License
          </button>
        )}

        {labId && (
          <button 
            className="btn btn-secondary mb-3 ms-2"
            onClick={() => window.location.href = '/licenses'}
          >
            View All Licenses
          </button>
        )}

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>ID</th>
                <th style={{ textAlign: 'center' }}>License Key</th>
                <th style={{ textAlign: 'center' }}>Lab</th>
                <th style={{ textAlign: 'center' }}>Issued Date</th>
                <th style={{ textAlign: 'center' }}>Expiry Date</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Created At</th>
                <th style={{ textAlign: 'center' }}>Updated At</th>
                {/* Show Actions column only if the user has table action permissions */}
                {hasTableActionPermissions() && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {licenses.length > 0 ? (
                licenses.map((license) => (
                  <tr key={license.license_id}>
                    <td style={{ textAlign: 'center' }}>{license.license_id}</td>
                    <td style={{ textAlign: 'center' }}>{license.license_key}</td>
                    <td style={{ textAlign: 'center' }}>{license.lab?.lab_name || 'N/A'}</td>
                    <td style={{ textAlign: 'center' }}>{formatDate(license.issued_date)}</td>
                    <td style={{ textAlign: 'center' }}>{formatDate(license.expiry_date)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${
                        license.status === 'active' ? 'bg-success' : 
                        license.status === 'expired' ? 'bg-danger' : 'bg-warning'
                      }`}>
                        {license.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{formatDate(license.created_at)}</td>
                    <td style={{ textAlign: 'center' }}>{formatDate(license.updated_at)}</td>
                    {/* Show Actions cell only if the user has table action permissions */}
                    {hasTableActionPermissions() && (
                      <td style={{ textAlign: 'center' }}>
                        {/* Show Edit button only if the user has update permission */}
                        {hasPermission('update') && (
                          <button
                            style={{ width: '58px', margin: '0 5px' }}
                            className="btn btn-warning btn-sm mb-1"
                            onClick={() => {
                              setSelectedLicense(license);
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {/* Show Delete button only if the user has delete permission */}
                        {hasPermission('delete') && (
                          <button
                            style={{ width: '58px', margin: '0 5px' }}
                            className="btn btn-danger btn-sm mb-1"
                            onClick={() => {
                              setSelectedLicense(license);
                              setShowDeleteModal(true);
                            }}
                          >
                            Delete
                          </button>
                        )}
                        {/* Show Activate/Deactivate buttons */}
                        {hasPermission('update') && (
                          license.status === 'active' ? (
                            <button
                              style={{ width: '90px', margin: '0 5px' }}
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDeactivate(license.license_id)}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              style={{ width: '90px', margin: '0 5px' }}
                              className="btn btn-success btn-sm"
                              onClick={() => handleActivate(license.license_id)}
                              disabled={license.status === 'expired'}
                            >
                              Activate
                            </button>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hasTableActionPermissions() ? 9 : 8} className="text-center">
                    No licenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create License Modal */}
      {showCreateModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <CreateLicenseModal
            labId={labId}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          />
        </Suspense>
      )}

      {/* Edit License Modal */}
      {showEditModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <EditLicenseModal
            license={selectedLicense}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleEdit}
          />
        </Suspense>
      )}

      {/* Delete License Modal */}
      {showDeleteModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <DeleteLicenseModal
            license={selectedLicense}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDelete}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Licenses;