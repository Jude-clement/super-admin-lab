import React, { useState, useEffect } from 'react';
import api from '../api';

const EditTicket = ({ ticket, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    assignee: '',
    representer_name: '',
    representer_email: '',
    representer_phone: '',
    eta: '',
    client_id: ''
  });

  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [newAttachment, setNewAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');

  useEffect(() => {
    if (ticket) {
      const initialData = {
        title: ticket.title || '',
        description: ticket.description || '',
        status: ticket.status || 'open',
        assignee: ticket.assignee || '',
        representer_name: ticket.representer_name || '',
        representer_email: ticket.representer_email || '',
        representer_phone: ticket.representer_phone || '',
        eta: ticket.eta ? ticket.eta.split('T')[0] : '',
        client_id: ticket.client_id || ''
      };

      setFormData(initialData);
      setOriginalData(initialData);
      
      if (ticket.attachment) {
        setFilePreview(`/storage/${ticket.attachment}`);
      }
    }
  }, [ticket]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'
      ];
      
      const maxSize = 50 * 1024 * 1024; // 50MB (matches backend's 51200KB)
      
      if (!validTypes.includes(file.type)) {
        setAttachmentError('Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP, SVG) or video (MP4, MOV, AVI, MKV, WEBM)');
        return;
      }
      
      if (file.size > maxSize) {
        setAttachmentError('File too large. Maximum size is 50MB');
        return;
      }

      setNewAttachment(file);
      setAttachmentError('');
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null); // No preview for videos
      }
    }
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData) || newAttachment;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setAttachmentError('');

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
      
      // Append all form fields
      formPayload.append('_method', 'PUT'); // Laravel needs this for PUT requests with FormData
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description);
      formPayload.append('status', formData.status);
      formPayload.append('assignee', formData.assignee);
      formPayload.append('representer_name', formData.representer_name);
      formPayload.append('representer_email', formData.representer_email);
      formPayload.append('representer_phone', formData.representer_phone);
      formPayload.append('eta', formData.eta);
      formPayload.append('client_id', formData.client_id);

      // Handle attachment
      if (newAttachment) {
        formPayload.append('attachment', newAttachment);
      } else if (!ticket.attachment) {
        // Explicitly send empty string if no attachment exists (to handle removal)
        formPayload.append('attachment', '');
      }

      // Debug: Log FormData contents
      for (let [key, value] of formPayload.entries()) {
        console.log(key, value);
      }

      // Use POST with _method=PUT for Laravel to properly handle FormData
      const response = await api.post(`/tickets/${ticket.id}`, formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      onSubmit(response.data);
    } catch (err) {
      console.error('Update error:', err);
      setErrors({
        general: err.response?.data?.message || 'Failed to update ticket'
      });
      if (err.response?.data?.errors?.attachment) {
        setAttachmentError(err.response.data.errors.attachment[0]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAttachmentPreview = () => {
    if (!filePreview && !newAttachment) return null;

    const isImage = newAttachment?.type?.startsWith('image/') || 
                   (ticket.attachment && /\.(jpg|jpeg|png|webp|svg)$/i.test(ticket.attachment));

    return (
      <div className="mt-2">
        <small>Current Attachment:</small>
        {isImage ? (
          <img 
            src={filePreview} 
            alt="Attachment preview" 
            className="img-thumbnail mt-1" 
            style={{ maxHeight: '100px' }}
          />
        ) : (
          <div className="alert alert-info mt-1">
            {newAttachment ? `Video file selected: ${newAttachment.name}` : `Existing file: ${ticket.attachment}`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">Edit Ticket {ticket?.id && `#${ticket.id}`}</h2>
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
                    style={{ height: '7.75rem' }}
                 ></textarea>

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
              <label className="mb-2">Attachment (Image/Video)</label>
  <div className="p-2 border rounded d-flex align-items-center justify-content-between">
    <input
      type="file"
      className={`form-control-file w-100 ${attachmentError ? 'is-invalid' : ''}`}
      onChange={handleFileChange}
      accept="image/*,video/*"
    />
  </div>
  {attachmentError && (
    <div className="invalid-feedback d-block mt-1">{attachmentError}</div>
  )}
  <div className="mt-3">{renderAttachmentPreview()}</div>
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
                disabled={isSubmitting || !hasChanges()}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTicket;