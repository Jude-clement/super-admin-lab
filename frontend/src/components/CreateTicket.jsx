import React, { useState, useCallback } from 'react';
import api from '../api';

const CreateTicket = ({ onCancel, onSubmit }) => {
  const initialFormData = {
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
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

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
    setFilePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  }, []);

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
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formPayload.append(key, value);
        }
      });

      const response = await api.post('/tickets', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onSubmit(response.data);
    } catch (err) {
      const backendErrors = err.response?.data?.errors || {};
      setErrors(backendErrors.general ? { general: backendErrors.general } : backendErrors);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, validateForm]);

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
          <h2 className="mb-0">Create New Ticket</h2>
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
              {filePreview && fileType === 'image' && (
                <div className="mt-3">
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

export default React.memo(CreateTicket);