import React, { useState, useEffect } from 'react';

const EditLabModal = ({ lab, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    lab_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    license_status: 'active'
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
        license_status: lab.license_status || 'active'
      });
    }
  }, [lab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: err.message || 'Failed to update lab' });
      }
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">Edit Lab</h2>
        </div>
        <div className="card-body">
          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
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
                {isSubmitting ? 'Updating...' : 'Update Lab'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLabModal;