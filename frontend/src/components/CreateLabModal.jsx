import React, { useState } from 'react';
import { generateLicenseKey } from '../utils/licenseGenerator';
import api from '../api';

const CreateLabModal = ({ onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    lab_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    license_status: 'active',
    includeLicense: true,
    license_key: '',
    issued_date: new Date().toISOString().split('T')[0],
    issued_time: '12:00',
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiry_time: '12:00'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleLicenseFields = (e) => {
    setFormData(prev => ({
      ...prev,
      includeLicense: e.target.checked
    }));
  };

  const handleGenerateKey = () => {
    const expiryDateTime = new Date(`${formData.expiry_date}T${formData.expiry_time}`);
    const generatedKey = generateLicenseKey(expiryDateTime.getTime());
    
    setFormData(prev => ({
      ...prev,
      license_key: generatedKey
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare the data in the correct format for the API
      const data = {
        lab_name: formData.lab_name,
        contact_person: formData.contact_person,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        address: formData.address,
        license_status: formData.license_status
      };

      // Include license data if checkbox is checked
      if (formData.includeLicense) {
        data.license_key = formData.license_key;
        data.issued_date = `${formData.issued_date}T${formData.issued_time}:00`;
        data.expiry_date = `${formData.expiry_date}T${formData.expiry_time}:00`;
      }

      // Call the API
      const response = await api.post('/labs', data);
      
      if (response.data.result) {
        onSubmit(response.data.data); // Notify parent of success
      } else {
        throw new Error(response.data.message || 'Failed to create lab');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: err.message || 'Failed to create lab' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">Create New Lab with License</h2>
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
                    <option value="expired">Expired</option>
                  </select>
                  {errors.license_status && (
                    <div className="invalid-feedback">{errors.license_status}</div>
                  )}
                </div>
              </div>
            </div>

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

            {formData.includeLicense && (
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

                <div className="form-group">
                  <label>License Key *</label>
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
                        onClick={handleGenerateKey}
                      >
                        Generate Key
                      </button>
                    </div>
                  </div>
                  {errors.license_key && (
                    <div className="invalid-feedback">{errors.license_key}</div>
                  )}
                  <small className="form-text text-muted">
                    Key will be generated based on expiry date and time
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
                disabled={isSubmitting || (formData.includeLicense && !formData.license_key)}
              >
                {isSubmitting ? 'Creating...' : 'Create Lab'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLabModal;