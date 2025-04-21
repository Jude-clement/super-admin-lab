import React, { useState, useEffect } from 'react';
import api from '../api';
import { format, parse, isValid } from 'date-fns';

const EditLab = ({ lab, onCancel, onSubmit }) => {
  const LICENSE_STATUS = {
    DEACTIVATED: 0,
    ACTIVE: 1
  };

  const [formData, setFormData] = useState({
    lab_name: '',
    app_url: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    license_key: '',
    issued_date: '',
    issued_time: '12:00',
    expiry_date: '',
    expiry_time: '12:00',
    timezone: 'Asia/Kolkata'
  });
  
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTokenSection, setShowTokenSection] = useState(false);
  const [dateFormatError, setDateFormatError] = useState(false);
  const [tokenDetails, setTokenDetails] = useState(null);

  const parseDateInput = (dateString, timeString) => {
    try {
      const parsedDate = parse(`${dateString} ${timeString}`, 'dd-MM-yyyy HH:mm', new Date());
      if (!isValid(parsedDate)) {
        throw new Error('Invalid date');
      }
      return parsedDate;
    } catch (error) {
      setDateFormatError(true);
      return null;
    }
  };

  const formatDisplayDate = (date) => {
    if (!date || !isValid(date)) return '';
    return format(date, 'dd-MM-yyyy');
  };

  const formatBackendDateTime = (dateString, timeString) => {
    const parsedDate = parseDateInput(dateString, timeString);
    if (!parsedDate) return null;
    return format(parsedDate, 'yyyy-MM-dd HH:mm:ss');
  };

  useEffect(() => {
    if (lab) {
      const license = lab.licenses?.[0] || {};
      const issuedDate = license.issued_date ? new Date(license.issued_date) : new Date();
      const expiryDate = license.expiry_date ? new Date(license.expiry_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      const initialData = {
        lab_name: lab.lab_name || '',
        app_url: lab.app_url || '',
        contact_person: lab.contact_person || '',
        contact_email: lab.contact_email || '',
        contact_phone: lab.contact_phone || '',
        address: lab.address || '',
        license_key: license.license_key || '',
        issued_date: formatDisplayDate(issuedDate),
        issued_time: format(issuedDate, 'HH:mm'),
        expiry_date: formatDisplayDate(expiryDate),
        expiry_time: format(expiryDate, 'HH:mm'),
        timezone: 'Asia/Kolkata'
      };

      setFormData(initialData);
      setOriginalData(initialData);
      setShowTokenSection(!!license.license_key);
      setDateFormatError(false);

      // Validate existing token if present
      if (license.license_key) {
        validateExistingToken(license.license_key);
      }
    }
  }, [lab]);

  const validateExistingToken = async (token) => {
    try {
      const response = await api.get(`/licenses/validate-token?token=${encodeURIComponent(token)}`);
      setTokenDetails({
        valid: response.data.valid,
        issued_at: response.data.data?.issued_at,
        expires_at: response.data.data?.expires_at
      });
    } catch (error) {
      console.error("Token validation failed:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if ((name === 'issued_date' || name === 'expiry_date') && dateFormatError) {
      setDateFormatError(false);
    }
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

  const validateDates = () => {
    const issuedDateTime = formatBackendDateTime(formData.issued_date, formData.issued_time);
    const expiryDateTime = formatBackendDateTime(formData.expiry_date, formData.expiry_time);
    
    if (!issuedDateTime || !expiryDateTime) {
      setErrors({ general: 'Invalid date format. Please use DD-MM-YYYY format' });
      return false;
    }
    
    if (new Date(expiryDateTime) <= new Date(issuedDateTime)) {
      setErrors({ general: 'Expiry date must be after issued date' });
      return false;
    }
    
    return true;
  };

  const handleRegenerateToken = async () => {
    if (!validateDates()) return;
    
    try {
      setIsSubmitting(true);
      setErrors({});
      
      const issuedAt = formatBackendDateTime(formData.issued_date, formData.issued_time);
      const expiresAt = formatBackendDateTime(formData.expiry_date, formData.expiry_time);
      
      const tokenResponse = await api.post('/licenses/generate-token', {
        lab_id: lab.lab_id,
        issued_at: issuedAt,
        expires_at: expiresAt,
        timezone: formData.timezone
      });

      // Validate the new token
      const validation = await api.get(`/licenses/validate-token?token=${encodeURIComponent(tokenResponse.data.token)}`);

      setFormData(prev => ({
        ...prev,
        license_key: tokenResponse.data.token
      }));

      setTokenDetails({
        valid: validation.data.valid,
        issued_at: validation.data.data?.issued_at,
        expires_at: validation.data.data?.expires_at
      });
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || 'Failed to regenerate token. Please check dates and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateDates()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Update lab details
      const labPayload = {
        lab_name: formData.lab_name,
        app_url: formData.app_url,
        contact_person: formData.contact_person,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        address: formData.address
      };
      
      const labResponse = await api.put(`/labs/${lab.lab_id}`, labPayload);
    
      // Update license if exists
      if (showTokenSection && lab.licenses?.[0]) {
        const licensePayload = {
          license_key: formData.license_key,
          issued_date: formatBackendDateTime(formData.issued_date, formData.issued_time),
          expiry_date: formatBackendDateTime(formData.expiry_date, formData.expiry_time),
          timezone: formData.timezone
        };
        
        await api.put(`/licenses/${lab.licenses[0].license_id}`, licensePayload);
      }
    
      onSubmit(labResponse.data.data);
    } catch (err) {
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
          
          {dateFormatError && (
            <div className="alert alert-warning">
              Please enter dates in DD-MM-YYYY format
            </div>
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
                </div>
                
                <div className="form-group">
                  <label>App URL</label>
                  <input
                    type="text"
                    name="app_url"
                    className={`form-control ${errors.app_url ? 'is-invalid' : ''}`}
                    value={formData.app_url}
                    onChange={handleChange}
                    required
                  />
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
                </div>
              </div>
            </div>

            {showTokenSection && (
              <div className="border p-3 mb-3 mt-3">
                <h5>License Information</h5>
                {/* <div className="alert alert-info">
                  <i className="fas fa-lock mr-2"></i>
                  License tokens are securely encrypted and cannot be decoded without server access
                </div> */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Issued Date (DD-MM-YYYY) *</label>
                      <input
                        type="text"
                        name="issued_date"
                        className={`form-control ${errors.issued_date ? 'is-invalid' : ''}`}
                        value={formData.issued_date}
                        onChange={handleChange}
                        placeholder="DD-MM-YYYY"
                        pattern="\d{2}-\d{2}-\d{4}"
                        required
                      />
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
                      <label>Expiry Date (DD-MM-YYYY) *</label>
                      <input
                        type="text"
                        name="expiry_date"
                        className={`form-control ${errors.expiry_date ? 'is-invalid' : ''}`}
                        value={formData.expiry_date}
                        onChange={handleChange}
                        placeholder="DD-MM-YYYY"
                        pattern="\d{2}-\d{2}-\d{4}"
                        required
                      />
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
                        {isSubmitting ? 'Generating...' : 'Regenerate Token'}
                      </button>
                    </div>
                  </div>
                  {/* {tokenDetails && (
                    <div className={`alert ${tokenDetails.valid ? 'alert-success' : 'alert-danger'} mt-2`}>
                      <div>
                        <strong>Token Status:</strong> {tokenDetails.valid ? 'Valid' : 'Invalid'}
                      </div>
                      <div>
                        <strong>Issued At:</strong> {tokenDetails.issued_at}
                      </div>
                      <div>
                        <strong>Expires At:</strong> {tokenDetails.expires_at}
                      </div>
                    </div>
                  )} */}
                  <small className="form-text text-muted">
                    Times are in {formData.timezone}. Token will be valid from {formData.issued_date} {formData.issued_time} to {formData.expiry_date} {formData.expiry_time}
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
                    <span className="spinner-border spinner-border-sm mr-2" role="status"></span>
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