import React, { useState } from 'react';
import api from '../api';

const CreateTicket = ({ onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    attachment: null,
    assignee: '',
    representer_name: '',
    representer_email: '',
    representer_phone: '',
    eta: '',
    client_id: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      const validTypes = [...validImageTypes, ...validVideoTypes];
      const maxSize = 20 * 1024 * 1024; // 20MB

      if (!validTypes.includes(file.type)) {
        setAttachmentError('Invalid file type. Please upload an image (JPEG, PNG, GIF) or video (MP4, MOV, AVI)');
        return;
      }

      if (file.size > maxSize) {
        setAttachmentError('File too large. Maximum size is 20MB');
        return;
      }

      setFormData(prev => ({ ...prev, attachment: file }));
      setAttachmentError('');
      setFileType(file.type.startsWith('image/') ? 'image' : 'video');

      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null); // No preview for videos
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate form
    const validationErrors = {};
    if (!formData.title) validationErrors.title = 'Title is required';
    if (!formData.description) validationErrors.description = 'Description is required';
    if (!formData.representer_name) validationErrors.representer_name = 'Representer name is required';
    if (!formData.representer_email) validationErrors.representer_email = 'Representer email is required';
    if (!formData.representer_phone) validationErrors.representer_phone = 'Representer phone is required';
    if (!formData.client_id) validationErrors.client_id = 'Client ID is required';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formPayload = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formPayload.append(key, formData[key]);
        }
      });

      const response = await api.post('/tickets', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      onSubmit(response.data);
    } catch (err) {
      const backendErrors = err.response?.data?.errors || {};
      if (Object.keys(backendErrors).length > 0) {
        setErrors(backendErrors);
      } else {
        setErrors({
          general: err.response?.data?.message || 'Failed to create ticket'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">Create New Ticket</h2>
        </div>
        <div className="card-body">
          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    value={formData.title}
                    onChange={handleChange}
                  />
                  {errors.title && (
                    <div className="invalid-feedback">{errors.title}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                  />
                  {errors.description && (
                    <div className="invalid-feedback">{errors.description}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="open">Open</option>
                    <option value="inprogress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label>Assignee</label>
                  <input
                    type="text"
                    name="assignee"
                    className="form-control"
                    value={formData.assignee}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Representer Name *</label>
                  <input
                    type="text"
                    name="representer_name"
                    className={`form-control ${errors.representer_name ? 'is-invalid' : ''}`}
                    value={formData.representer_name}
                    onChange={handleChange}
                  />
                  {errors.representer_name && (
                    <div className="invalid-feedback">{errors.representer_name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Representer Email *</label>
                  <input
                    type="email"
                    name="representer_email"
                    className={`form-control ${errors.representer_email ? 'is-invalid' : ''}`}
                    value={formData.representer_email}
                    onChange={handleChange}
                  />
                  {errors.representer_email && (
                    <div className="invalid-feedback">{errors.representer_email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Representer Phone *</label>
                  <input
                    type="text"
                    name="representer_phone"
                    className={`form-control ${errors.representer_phone ? 'is-invalid' : ''}`}
                    value={formData.representer_phone}
                    onChange={handleChange}
                  />
                  {errors.representer_phone && (
                    <div className="invalid-feedback">{errors.representer_phone}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Client ID *</label>
                  <input
                    type="text"
                    name="client_id"
                    className={`form-control ${errors.client_id ? 'is-invalid' : ''}`}
                    value={formData.client_id}
                    onChange={handleChange}
                  />
                  {errors.client_id && (
                    <div className="invalid-feedback">{errors.client_id}</div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label>ETA</label>
                  <input
                    type="date"
                    name="eta"
                    className="form-control"
                    value={formData.eta}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Attachment (Image/Video)</label>
              <input
                type="file"
                className={`form-control ${attachmentError ? 'is-invalid' : ''}`}
                onChange={handleFileChange}
                accept="image/*,video/*"
              />
              {attachmentError && (
                <div className="invalid-feedback d-block">{attachmentError}</div>
              )}
              {filePreview && fileType === 'image' && (
                <div className="mt-2">
                  <small>Preview:</small>
                  <img 
                    src={filePreview} 
                    alt="Attachment preview" 
                    className="img-thumbnail mt-1" 
                    style={{ maxHeight: '100px' }}
                  />
                </div>
              )}
              {formData.attachment && fileType === 'video' && (
                <div className="alert alert-info mt-2">
                  Video file selected: {formData.attachment.name}
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary mr-2"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  'Create Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;