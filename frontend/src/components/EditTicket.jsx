import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const EditTicket = ({ ticket, onCancel, onSubmit }) => {
  const initialFormData = {
    title: '',
    description: '',
    status: 'open',
    assignee: '',
    representer_name: '',
    representer_email: '',
    representer_phone: '',
    eta: '',
    client_id: ''
  };

  const [formData, setFormData] = useState(initialFormData);
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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

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
    setFilePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  }, []);

  const hasChanges = useCallback(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData) || newAttachment;
  }, [formData, originalData, newAttachment]);

  const validateForm = useCallback(() => {
    const requiredFields = [
      'title', 'description', 'representer_name',
      'representer_email', 'representer_phone', 'client_id'
    ];
    const validationErrors = {};

    requiredFields.forEach(field => {
      if (!formData[field]) {
        validationErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('_method', 'PUT');
      Object.entries(formData).forEach(([key, value]) => {
        formPayload.append(key, value);
      });

      if (newAttachment) {
        formPayload.append('attachment', newAttachment);
      } else if (!ticket.attachment) {
        formPayload.append('attachment', '');
      }

      const response = await api.post(`/tickets/${ticket.id}`, formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onSubmit(response.data);
    } catch (err) {
      console.error('Update error:', err);
      const backendErrors = err.response?.data?.errors || {};
      setErrors(backendErrors.general ? { general: backendErrors.general } : backendErrors);
      if (backendErrors.attachment) {
        setAttachmentError(backendErrors.attachment[0]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, newAttachment, ticket, validateForm, onSubmit]);

  const renderAttachmentPreview = useCallback(() => {
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
  }, [filePreview, newAttachment, ticket]);

  const renderFormField = (name, label, type = 'text', options = null) => (
    <div className="form-group">
      <label>{label} {errors[name] && '*'}</label>
      {type === 'select' ? (
        <select
          name={name}
          className="form-control"
          value={formData[name]}
          onChange={handleChange}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
          value={formData[name]}
          onChange={handleChange}
          style={{ height: '7.75rem' }}
        />
      ) : (
        <input
          type={type}
          name={name}
          className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
          value={formData[name]}
          onChange={handleChange}
        />
      )}
      {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
    </div>
  );

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">Edit Ticket {ticket?.id && `#${ticket.id}`}</h2>
        </div>
        <div className="card-body">
          {errors.general && <div className="alert alert-danger">{errors.general}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                {renderFormField('title', 'Title *')}
                {renderFormField('description', 'Description *', 'textarea')}
                {renderFormField('status', 'Status', 'select', [
                  { value: 'open', label: 'Open' },
                  { value: 'inprogress', label: 'In Progress' },
                  { value: 'closed', label: 'Closed' }
                ])}
              </div>

              <div className="col-md-6">
                {renderFormField('assignee', 'Assignee')}
                {renderFormField('representer_name', 'Representer Name *')}
                {renderFormField('representer_email', 'Representer Email *', 'email')}
                {renderFormField('representer_phone', 'Representer Phone *')}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                {renderFormField('client_id', 'Client ID *')}
              </div>
              <div className="col-md-6">
                {renderFormField('eta', 'ETA', 'date')}
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

export default React.memo(EditTicket);