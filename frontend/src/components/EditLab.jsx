import React, { useState, useEffect } from 'react';
import api from '../api';

const EditLab = ({ lab, onCancel, onSubmit }) => {
  // Status constants
  const LICENSE_STATUS = {
    DEACTIVATED: 0,
    ACTIVE: 1
  };

  const [formData, setFormData] = useState({
    lab_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    // license_status: 'active', // Maintain string status for lab
    license_key: '',
    issued_date: '',
    issued_time: '12:00',
    expiry_date: '',
    expiry_time: '12:00'
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTokenSection, setShowTokenSection] = useState(false);

  // Helper function to format date for display (YYYY-MM-DD to DD-MM-YYYY)
  const formatDisplayDate = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  };

  // Helper function to format date for backend (DD-MM-YYYY to YYYY-MM-DD)
  const formatBackendDate = (displayDate) => {
    if (!displayDate) return '';
    const [day, month, year] = displayDate.split('-');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (lab) {
      const license = lab.licenses?.[0] || {};
      const issuedDate = license.issued_date ? new Date(license.issued_date) : new Date();
      const expiryDate = license.expiry_date ? new Date(license.expiry_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      const initialData = {
        lab_name: lab.lab_name || '',
        contact_person: lab.contact_person || '',
        contact_email: lab.contact_email || '',
        contact_phone: lab.contact_phone || '',
        address: lab.address || '',
        license_status: lab.license_status || 'active',
        license_key: license.license_key || '',
        issued_date: formatDisplayDate(issuedDate.toISOString()),
        issued_time: issuedDate.toTimeString().substring(0, 5),
        expiry_date: formatDisplayDate(expiryDate.toISOString()),
        expiry_time: expiryDate.toTimeString().substring(0, 5)
      };

      setFormData(initialData);
      setOriginalData(initialData);
      setShowTokenSection(!!license.license_key);
    }
  }, [lab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const hasLicenseDateChanges = () => {
    if (!showTokenSection) return false;
    return (
      formData.issued_date !== originalData.issued_date ||
      formData.issued_time !== originalData.issued_time ||
      formData.expiry_date !== originalData.expiry_date ||
      formData.expiry_time !== originalData.expiry_time
    );
  };

  const handleRegenerateToken = async () => {
    try {
      setIsSubmitting(true);
      
      // Convert display dates to backend format before creating Date objects
      const backendIssuedDate = formatBackendDate(formData.issued_date);
      const backendExpiryDate = formatBackendDate(formData.expiry_date);
      
      // Create properly formatted datetime strings
      const issuedAt = `${backendIssuedDate} ${formData.issued_time}:00`;
      const expiresAt = `${backendExpiryDate} ${formData.expiry_time}:00`;
      
          // Validate dates
    if (new Date(expiresAt) <= new Date(issuedAt)) {
      throw new Error('Expiry time must be after issued time');
    }
    
      const tokenResponse = await api.post('/licenses/generate-token', {
        lab_id: lab.lab_id,
        issued_at: issuedAt,
        expires_at: expiresAt
      });

      setFormData(prev => ({
        ...prev,
        license_key: tokenResponse.data.token
      }));
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || 'Failed to regenerate token'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Update lab details - remove license_status since it's auto-managed
      const labResponse = await api.put(`/labs/${lab.lab_id}`, {
        lab_name: formData.lab_name,
        contact_person: formData.contact_person,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        address: formData.address
      });
    
      // Update license if exists - remove manual status setting
      if (showTokenSection && lab.licenses?.[0]) {
        const backendIssuedDate = formatBackendDate(formData.issued_date);
        const backendExpiryDate = formatBackendDate(formData.expiry_date);
        
        await api.put(`/licenses/${lab.licenses[0].license_id}`, {
          license_key: formData.license_key,
          issued_date: `${backendIssuedDate} ${formData.issued_time}:00`,
          expiry_date: `${backendExpiryDate} ${formData.expiry_time}:00`
          // Status will be auto-updated by scheduler
        });
      }
    
      onSubmit(labResponse.data.data);
    } 
    catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ 
          general: err.response?.data?.message || 'Failed to update. Please try again.' 
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
          <h2 className="mb-0">Edit Lab {lab?.lab_id && `#${lab.lab_id}`}</h2>
        </div>
        <div className="card-body">
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
              </div>
              
              <div className="col-md-6">
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
                    rows={3}
                  />
                  {errors.address && (
                    <div className="invalid-feedback">{errors.address}</div>
                  )}
                </div>
                
                {/* <div className="form-group">
                  <label>License Status *</label>
                  <select
                    name="license_status"
                    className={`form-control ${errors.license_status ? 'is-invalid' : ''}`}
                    value={formData.license_status}
                    onChange={handleChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {errors.license_status && (
                    <div className="invalid-feedback">{errors.license_status}</div>
                  )}
                </div> */}
              </div>
            </div>

            {showTokenSection && (
              <div className="border p-3 mb-3 mt-3">
                <h5>License Information</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Issued Date *</label>
                      <input
                        type="text"
                        name="issued_date"
                        className={`form-control ${errors.issued_date ? 'is-invalid' : ''}`}
                        value={formData.issued_date}
                        onChange={handleChange}
                        placeholder="DD-MM-YYYY"
                        required
                      />
                      {errors.issued_date && (
                        <div className="invalid-feedback">{errors.issued_date}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Issued Time *</label>
                      <input
                        type="time"
                        name="issued_time"
                        className={`form-control ${errors.issued_time ? 'is-invalid' : ''}`}
                        value={formData.issued_time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Expiry Date *</label>
                      <input
                        type="text"
                        name="expiry_date"
                        className={`form-control ${errors.expiry_date ? 'is-invalid' : ''}`}
                        value={formData.expiry_date}
                        onChange={handleChange}
                        placeholder="DD-MM-YYYY"
                        required
                      />
                      {errors.expiry_date && (
                        <div className="invalid-feedback">{errors.expiry_date}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Expiry Time *</label>
                      <input
                        type="time"
                        name="expiry_time"
                        className={`form-control ${errors.expiry_time ? 'is-invalid' : ''}`}
                        value={formData.expiry_time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>License Token *</label>
                  <div className="input-group">
                    <input
                      type="text"
                      name="license_key"
                      className={`form-control ${errors.license_key ? 'is-invalid' : ''}`}
                      value={formData.license_key}
                      onChange={handleChange}
                      required
                      readOnly
                    />
                    <div className="input-group-append">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleRegenerateToken}
                        disabled={isSubmitting || !hasLicenseDateChanges()}
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                  {errors.license_key && (
                    <div className="invalid-feedback">{errors.license_key}</div>
                  )}
                  <small className="form-text text-muted">
                    Token valid from {formData.issued_date} {formData.issued_time} to {formData.expiry_date} {formData.expiry_time}
                  </small>
                </div>
              </div>
            )}

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

export default EditLab;