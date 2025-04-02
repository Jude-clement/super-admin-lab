import React, { useState } from 'react';
import api from '../api';

const CreateLabModal = ({ onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    // Lab Info
    lab_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    license_status: 'active',
    includeLicense: true,
    
    // License Info
    issued_date: new Date().toISOString().split('T')[0],
    issued_time: '12:00',
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiry_time: '12:00',
    license_token: '',
    created_lab_id: null
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Lab info, 2: License info

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleLicenseFields = (e) => {
    setFormData(prev => ({ ...prev, includeLicense: e.target.checked }));
  };

  const handleNext = async () => {
    // Validate lab info only
    const labErrors = {};
    if (!formData.lab_name) labErrors.lab_name = 'Lab name is required';
    if (!formData.contact_person) labErrors.contact_person = 'Contact person is required';
    if (!formData.contact_email) labErrors.contact_email = 'Contact email is required';
    if (!formData.contact_phone) labErrors.contact_phone = 'Contact phone is required';
    if (!formData.address) labErrors.address = 'Address is required';

    if (Object.keys(labErrors).length > 0) {
      setErrors(labErrors);
      return;
    }

    setErrors({});
    setStep(2);
  };

  const handleGenerateToken = async () => {
    try {
      setIsSubmitting(true);
      
      // First create the lab
      const labResponse = await api.post('/labs', {
        lab_name: formData.lab_name,
        contact_person: formData.contact_person,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        address: formData.address,
        license_status: formData.license_status
      });

      const labId = labResponse.data.data.lab_id;
      
      // Now generate token with the lab ID
      const issuedAt = `${formData.issued_date} ${formData.issued_time}:00`;
      const expiresAt = `${formData.expiry_date} ${formData.expiry_time}:00`;
      
      const tokenResponse = await api.post('/licenses/generate-token', {
        lab_id: labId,
        issued_at: issuedAt,
        expires_at: expiresAt
      });

      setFormData(prev => ({
        ...prev,
        license_token: tokenResponse.data.token,
        created_lab_id: labId
      }));

    } catch (err) {
      setErrors({
        general: err.response?.data?.message || 'Failed to create lab and generate token'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create license if needed
      if (formData.includeLicense && formData.license_token) {
        await api.post('/licenses', {
          client_id: formData.created_lab_id,
          license_key: formData.license_token,
          issued_date: `${formData.issued_date} ${formData.issued_time}:00`,
          expiry_date: `${formData.expiry_date} ${formData.expiry_time}:00`,
          status: 'active'
        });
      }

      onSubmit({ lab_id: formData.created_lab_id });
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || 'Failed to create license'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">
            {step === 1 ? 'Create New Lab' : 'Add License Information'}
          </h2>
        </div>
        <div className="card-body">
          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              // Step 1: Lab Information
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
                      <option value="inactive">Inactive</option>
                    </select>
                    {errors.license_status && (
                      <div className="invalid-feedback">{errors.license_status}</div>
                    )}
                  </div>
                </div>

                <div className="col-12">
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="includeLicense"
                      checked={formData.includeLicense}
                      onChange={toggleLicenseFields}
                    />
                    <label className="form-check-label" htmlFor="includeLicense">
                      Include License
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              // Step 2: License Information
              <div className="border p-3 mb-3">
                <h5>License Information</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Issued Date *</label>
                      <input
                        type="date"
                        name="issued_date"
                        className={`form-control ${errors.issued_date ? 'is-invalid' : ''}`}
                        value={formData.issued_date}
                        onChange={handleChange}
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
                        type="date"
                        name="expiry_date"
                        className={`form-control ${errors.expiry_date ? 'is-invalid' : ''}`}
                        value={formData.expiry_date}
                        onChange={handleChange}
                        min={formData.issued_date}
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

                {formData.includeLicense && (
                  <div className="form-group">
                    <label>License Token *</label>
                    <div className="input-group">
                      <input
                        type="text"
                        name="license_token"
                        className={`form-control ${errors.license_token ? 'is-invalid' : ''}`}
                        value={formData.license_token}
                        onChange={handleChange}
                        readOnly
                        required
                      />
                      <div className="input-group-append">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleGenerateToken}
                          disabled={isSubmitting}
                        >
                          {formData.license_token ? 'Regenerate' : 'Generate'} Token
                        </button>
                      </div>
                    </div>
                    {errors.license_token && (
                      <div className="invalid-feedback">{errors.license_token}</div>
                    )}
                    <small className="form-text text-muted">
                      Token will be valid from {formData.issued_date} {formData.issued_time} to {formData.expiry_date} {formData.expiry_time}
                    </small>
                  </div>
                )}
              </div>
            )}

            <div className="d-flex justify-content-end mt-4">
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary mr-2"
                    onClick={onCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Next: Add License
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary mr-2"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || (formData.includeLicense && !formData.license_token)}
                  >
                    {isSubmitting ? 'Creating...' : 'Complete Registration'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLabModal;