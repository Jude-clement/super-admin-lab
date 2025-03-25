import React, { useState, useEffect } from 'react';

const EditLabModal = ({ lab, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    lab_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    license_status: 'active',
    settings: {
      name: '',
      phone: '',
      email: '',
      website_link: '',
      whatsappactivated: false,
      whatsappno: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lab) {
      setFormData({
        lab_name: lab.lab_name || '',
        contact_person: lab.contact_person || '',
        contact_email: lab.contact_email || '',
        contact_phone: lab.contact_phone || '',
        address: lab.address || '',
        license_status: lab.license_status || 'active',
        settings: lab.settings ? {
          name: lab.settings.name || '',
          phone: lab.settings.phone || '',
          email: lab.settings.email || '',
          website_link: lab.settings.website_link || '',
          whatsappactivated: lab.settings.whatsappactivated || false,
          whatsappno: lab.settings.whatsappno || ''
        } : {
          name: '',
          phone: '',
          email: '',
          website_link: '',
          whatsappactivated: false,
          whatsappno: ''
        }
      });
    }
  }, [lab]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: err.message || 'Failed to update lab' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Lab</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {errors.general && (
              <div className="alert alert-danger">{errors.general}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <h5>Lab Information</h5>
                  <div className="form-group">
                    <label>Lab Name *</label>
                    <input
                      type="text"
                      name="lab_name"
                      className={`form-control ${errors.lab_name ? 'is-invalid' : ''}`}
                      value={formData.lab_name}
                      onChange={handleChange}
                      required
                    />
                    {errors.lab_name && (
                      <div className="invalid-feedback">{errors.lab_name}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input
                      type="text"
                      name="contact_person"
                      className={`form-control ${errors.contact_person ? 'is-invalid' : ''}`}
                      value={formData.contact_person}
                      onChange={handleChange}
                      required
                    />
                    {errors.contact_person && (
                      <div className="invalid-feedback">{errors.contact_person}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Contact Email *</label>
                    <input
                      type="email"
                      name="contact_email"
                      className={`form-control ${errors.contact_email ? 'is-invalid' : ''}`}
                      value={formData.contact_email}
                      onChange={handleChange}
                      required
                    />
                    {errors.contact_email && (
                      <div className="invalid-feedback">{errors.contact_email}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Contact Phone *</label>
                    <input
                      type="text"
                      name="contact_phone"
                      className={`form-control ${errors.contact_phone ? 'is-invalid' : ''}`}
                      value={formData.contact_phone}
                      onChange={handleChange}
                      required
                    />
                    {errors.contact_phone && (
                      <div className="invalid-feedback">{errors.contact_phone}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Address *</label>
                    <textarea
                      name="address"
                      className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                    {errors.address && (
                      <div className="invalid-feedback">{errors.address}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>License Status *</label>
                    <select
                      name="license_status"
                      className={`form-control ${errors.license_status ? 'is-invalid' : ''}`}
                      value={formData.license_status}
                      onChange={handleChange}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    {errors.license_status && (
                      <div className="invalid-feedback">{errors.license_status}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <h5>Settings</h5>
                  <div className="form-group">
                    <label>Settings Name *</label>
                    <input
                      type="text"
                      name="settings.name"
                      className={`form-control ${errors['settings.name'] ? 'is-invalid' : ''}`}
                      value={formData.settings.name}
                      onChange={handleChange}
                      required
                    />
                    {errors['settings.name'] && (
                      <div className="invalid-feedback">{errors['settings.name']}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Settings Phone *</label>
                    <input
                      type="text"
                      name="settings.phone"
                      className={`form-control ${errors['settings.phone'] ? 'is-invalid' : ''}`}
                      value={formData.settings.phone}
                      onChange={handleChange}
                      required
                    />
                    {errors['settings.phone'] && (
                      <div className="invalid-feedback">{errors['settings.phone']}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Settings Email *</label>
                    <input
                      type="email"
                      name="settings.email"
                      className={`form-control ${errors['settings.email'] ? 'is-invalid' : ''}`}
                      value={formData.settings.email}
                      onChange={handleChange}
                      required
                    />
                    {errors['settings.email'] && (
                      <div className="invalid-feedback">{errors['settings.email']}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Website Link</label>
                    <input
                      type="text"
                      name="settings.website_link"
                      className={`form-control ${errors['settings.website_link'] ? 'is-invalid' : ''}`}
                      value={formData.settings.website_link}
                      onChange={handleChange}
                    />
                    {errors['settings.website_link'] && (
                      <div className="invalid-feedback">{errors['settings.website_link']}</div>
                    )}
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      name="settings.whatsappactivated"
                      className="form-check-input"
                      checked={formData.settings.whatsappactivated}
                      onChange={handleChange}
                    />
                    <label className="form-check-label">WhatsApp Activated</label>
                  </div>
                  {formData.settings.whatsappactivated && (
                    <div className="form-group">
                      <label>WhatsApp Number</label>
                      <input
                        type="text"
                        name="settings.whatsappno"
                        className={`form-control ${errors['settings.whatsappno'] ? 'is-invalid' : ''}`}
                        value={formData.settings.whatsappno}
                        onChange={handleChange}
                      />
                      {errors['settings.whatsappno'] && (
                        <div className="invalid-feedback">{errors['settings.whatsappno']}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLabModal;