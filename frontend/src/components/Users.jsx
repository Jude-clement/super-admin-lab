import React, { useEffect, useState, Suspense } from 'react';
import api from '../api'; // Import the Axios instance

// Lazy load the modal components
const CreateUserModal = React.lazy(() => import('./CreateUserModal '));
const EditUserModal = React.lazy(() => import('./EditUserModal'));
const DeleteUserModal = React.lazy(() => import('./DeleteUserModal'));

const Users = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]); // Store user permissions

  // Fetch users from the backend
  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.data.result) {
        setUsers(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
      console.error('Failed to fetch users', err);
    }
  };

  // Fetch user profile to get roles and permissions
  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data.success) {
        setPermissions(response.data.permissions); // Set permissions
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProfile(); // Fetch profile on component mount
  }, []);

  // Check if the user has a specific permission
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  // Check if the user has any table action permissions (update or delete)
  const hasTableActionPermissions = () => {
    return hasPermission('update') || hasPermission('delete');
  };

  // Handle create user
  const handleCreate = async (userData) => {
    if (!hasPermission('add')) {
      alert('You do not have permission to add users.');
      return;
    }
    try {
      const response = await api.post('/users', userData);
      if (response.data.result) {
        setUsers([...users, response.data.data]);
        fetchUsers(); // Call fetchUsers after editing
      } else {
        throw new Error(response.data.message || 'Failed to create user.');
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle edit user
  const handleEdit = async (userData) => {
    if (!hasPermission('update')) {
      alert('You do not have permission to edit users.');
      return;
    }
    if (!selectedUser) return; // Ensure selectedUser is defined
    try {
      const response = await api.put(`/users/${selectedUser.id}`, userData);
      if (response.data.result) {
        const updatedUsers = users.map((user) =>
          user.id === selectedUser.id ? { ...user, ...response.data.data } : user
        );
        setUsers(updatedUsers);
        fetchUsers(); // Call fetchUsers after editing
      } else {
        throw new Error(response.data.message || 'Failed to update user.');
      }
    } catch (err) {
      throw err; // Throw the error so that EditUserModal can catch it
    }
  };

  // Handle delete user
  const handleDelete = async () => {
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete users.');
      return;
    }
    if (!selectedUser) return; // Ensure selectedUser is defined
    try {
      const response = await api.delete(`/users/${selectedUser.id}`);
      if (response.data.result) {
        const updatedUsers = users.filter((user) => user.id !== selectedUser.id);
        setUsers(updatedUsers);
        fetchUsers(); // Call fetchUsers after editing
      } else {
        throw new Error(response.data.message || 'Failed to delete user.');
      }
    } catch (err) {
      throw err; // Throw the error so that DeleteUserModal can catch it
    }
  };

  // Format date to a readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(); // Adjust the format as needed
  };

  return (
    <div className="card">
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {/* Show Create User button only if the user has "add" permission */}
        {hasPermission('add') && (
          <button className="btn btn-primary mb-3" onClick={() => setShowCreateModal(true)}>
            Create User
          </button>
        )}
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>ID</th>
              <th style={{ textAlign: 'center' }}>Name</th>
              <th style={{ textAlign: 'center' }}>Email</th>
              <th style={{ textAlign: 'center' }}>Role</th>
              <th style={{ textAlign: 'center' }}>Address</th>
              <th style={{ textAlign: 'center' }}>Created At</th>
              <th style={{ textAlign: 'center' }}>Updated At</th>
              {/* Show Actions column only if the user has table action permissions (update or delete) */}
              {hasTableActionPermissions() && <th style={{ textAlign: 'center' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ textAlign: 'center' }}>{user.id}</td>
                <td style={{ textAlign: 'center' }}>{user.username}</td>
                <td style={{ textAlign: 'center' }}>{user.email}</td>
                <td style={{ textAlign: 'center' }}>{user.roles[0]?.name}</td>
                <td style={{ textAlign: 'center' }}>{user.address}</td>
                <td style={{ textAlign: 'center' }}>{formatDate(user.created_at)}</td>
                <td style={{ textAlign: 'center' }}>{formatDate(user.updated_at)}</td>
                {/* Show Actions cell only if the user has table action permissions (update or delete) */}
                {hasTableActionPermissions() && (
                  <td style={{ textAlign: 'center' }}>
                    {/* Show Edit button only if the user has "update" permission */}
                    {hasPermission('update') && (
                      <button
                        style={{
                          width: '58px',
                          margin: '0 5px',
                        }}
                        className="btn btn-warning btn-sm mb-1"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {/* Show Delete button only if the user has "delete" permission */}
                    {hasPermission('delete') && (
                      <button
                        style={{
                          width: '58px',
                          margin: '0 5px',
                        }}
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          />
        </Suspense>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <EditUserModal
            user={selectedUser}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleEdit}
          />
        </Suspense>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <DeleteUserModal
            user={selectedUser}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDelete}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Users;