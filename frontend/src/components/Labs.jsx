import React, { useEffect, useState, Suspense } from 'react';
import api from '../api';

// Lazy load the modal components
const CreateLabModal = React.lazy(() => import('./CreateLabModal'));
const EditLabModal = React.lazy(() => import('./EditLabModal'));
const DeleteLabModal = React.lazy(() => import('./DeleteLabModal '));

const Labs = () => {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch labs from the backend
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

  // Handle create lab
  const handleCreate = async (labData) => {
    if (!hasPermission('add')) {
      alert('You do not have permission to create labs.');
      return;
    }
    try {
      const response = await api.post('/labs', labData);
      if (response.data.result) {
        setLabs([...labs, response.data.data]);
        fetchLabs(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to create lab.');
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle edit lab
  const handleEdit = async (labData) => {
    if (!hasPermission('update')) {
      alert('You do not have permission to edit labs.');
      return;
    }
    if (!selectedLab) return;
    try {
      const response = await api.put(`/labs/${selectedLab.lab_id}`, labData);
      if (response.data.result) {
        const updatedLabs = labs.map((lab) =>
          lab.lab_id === selectedLab.lab_id ? { ...lab, ...response.data.data } : lab
        );
        setLabs(updatedLabs);
        fetchLabs(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to update lab.');
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle delete lab
  const handleDelete = async () => {
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete labs.');
      return;
    }
    if (!selectedLab) return;
    try {
      const response = await api.delete(`/labs/${selectedLab.lab_id}`);
      if (response.data.result) {
        const updatedLabs = labs.filter((lab) => lab.lab_id !== selectedLab.lab_id);
        setLabs(updatedLabs);
        fetchLabs(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to delete lab.');
      }
    } catch (err) {
      throw err;
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
        
        {/* Show Create Lab button only if the user has permission */}
        {hasPermission('add') && (
          <button 
            className="btn btn-primary mb-3" 
            onClick={() => setShowCreateModal(true)}
          >
            Create Lab
          </button>
        )}

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>ID</th>
                <th style={{ textAlign: 'center' }}>Lab Name</th>
                <th style={{ textAlign: 'center' }}>Contact Person</th>
                <th style={{ textAlign: 'center' }}>Contact Email</th>
                <th style={{ textAlign: 'center' }}>Contact Phone</th>
                <th style={{ textAlign: 'center' }}>Address</th>
                <th style={{ textAlign: 'center' }}>License Status</th>
                <th style={{ textAlign: 'center' }}>Created At</th>
                <th style={{ textAlign: 'center' }}>Updated At</th>
                {/* Show Actions column only if the user has table action permissions */}
                {hasTableActionPermissions() && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {labs.length > 0 ? (
                labs.map((lab) => (
                  <tr key={lab.lab_id}>
                    <td style={{ textAlign: 'center' }}>{lab.lab_id}</td>
                    <td style={{ textAlign: 'center' }}>{lab.lab_name}</td>
                    <td style={{ textAlign: 'center' }}>{lab.contact_person}</td>
                    <td style={{ textAlign: 'center' }}>{lab.contact_email}</td>
                    <td style={{ textAlign: 'center' }}>{lab.contact_phone}</td>
                    <td style={{ textAlign: 'center' }}>{lab.address}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${lab.license_status === 'active' ? 'bg-success' : lab.license_status === 'expired' ? 'bg-danger' : 'bg-warning'}`}>
                        {lab.license_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{formatDate(lab.created_at)}</td>
                    <td style={{ textAlign: 'center' }}>{formatDate(lab.updated_at)}</td>
                    {/* Show Actions cell only if the user has table action permissions */}
                    {hasTableActionPermissions() && (
                      <td style={{ textAlign: 'center' }}>
                        {/* Show Edit button only if the user has update permission */}
                        {hasPermission('update') && (
                          <button
                            style={{ width: '58px', margin: '0 5px' }}
                            className="btn btn-warning btn-sm mb-1"
                            onClick={() => {
                              setSelectedLab(lab);
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
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setSelectedLab(lab);
                              setShowDeleteModal(true);
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hasTableActionPermissions() ? 10 : 9} className="text-center">
                    No labs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lab Modal */}
      {showCreateModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <CreateLabModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          />
        </Suspense>
      )}

      {/* Edit Lab Modal */}
      {showEditModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <EditLabModal
            lab={selectedLab}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleEdit}
          />
        </Suspense>
      )}

      {/* Delete Lab Modal */}
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