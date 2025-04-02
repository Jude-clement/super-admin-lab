// import React, { useState, useEffect } from 'react';
// import api from '../api';

// const EditLicenseModal = ({ license, onClose, onSubmit }) => {
//   const [formData, setFormData] = useState({
//     client_id: '',
//     license_key: '',
//     issued_date: '',
//     expiry_date: '',
//     status: 'inactive'
//   });
//   const [labs, setLabs] = useState([]);
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (license) {
//       setFormData({
//         client_id: license.client_id || '',
//         license_key: license.license_key || '',
//         issued_date: license.issued_date.split('T')[0] || '',
//         expiry_date: license.expiry_date.split('T')[0] || '',
//         status: license.status || 'inactive'
//       });
//     }

//     const fetchLabs = async () => {
//       try {
//         const response = await api.get('/labs');
//         if (response.data.result) {
//           setLabs(response.data.data);
//         }
//       } catch (err) {
//         console.error('Failed to fetch labs', err);
//       }
//     };
//     fetchLabs();
//   }, [license]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     try {
//       await onSubmit(formData);
//       onClose();
//     } catch (err) {
//       if (err.response?.data?.errors) {
//         setErrors(err.response.data.errors);
//       } else {
//         setErrors({ general: err.message || 'Failed to update license' });
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal show d-block" tabIndex="-1" role="dialog">
//       <div className="modal-dialog" role="document">
//         <div className="modal-content">
//           <div className="modal-header">
//             <h5 className="modal-title">Edit License</h5>
//             <button type="button" className="close" onClick={onClose}>
//               <span>&times;</span>
//             </button>
//           </div>
//           <div className="modal-body">
//             {errors.general && (
//               <div className="alert alert-danger">{errors.general}</div>
//             )}
//             <form onSubmit={handleSubmit}>
//               <div className="form-group">
//                 <label>Lab *</label>
//                 <select
//                   name="client_id"
//                   className={`form-control ${errors.client_id ? 'is-invalid' : ''}`}
//                   value={formData.client_id}
//                   onChange={handleChange}
//                   required
//                 >
//                   <option value="">Select Lab</option>
//                   {labs.map(lab => (
//                     <option key={lab.lab_id} value={lab.lab_id}>{lab.lab_name}</option>
//                   ))}
//                 </select>
//                 {errors.client_id && (
//                   <div className="invalid-feedback">{errors.client_id}</div>
//                 )}
//               </div>
//               <div className="form-group">
//                 <label>License Key *</label>
//                 <input
//                   type="text"
//                   name="license_key"
//                   className={`form-control ${errors.license_key ? 'is-invalid' : ''}`}
//                   value={formData.license_key}
//                   onChange={handleChange}
//                   required
//                 />
//                 {errors.license_key && (
//                   <div className="invalid-feedback">{errors.license_key}</div>
//                 )}
//               </div>
//               <div className="form-group">
//                 <label>Issued Date *</label>
//                 <input
//                   type="date"
//                   name="issued_date"
//                   className={`form-control ${errors.issued_date ? 'is-invalid' : ''}`}
//                   value={formData.issued_date}
//                   onChange={handleChange}
//                   required
//                 />
//                 {errors.issued_date && (
//                   <div className="invalid-feedback">{errors.issued_date}</div>
//                 )}
//               </div>
//               <div className="form-group">
//                 <label>Expiry Date *</label>
//                 <input
//                   type="date"
//                   name="expiry_date"
//                   className={`form-control ${errors.expiry_date ? 'is-invalid' : ''}`}
//                   value={formData.expiry_date}
//                   onChange={handleChange}
//                   min={formData.issued_date}
//                   required
//                 />
//                 {errors.expiry_date && (
//                   <div className="invalid-feedback">{errors.expiry_date}</div>
//                 )}
//               </div>
//               <div className="form-group">
//                 <label>Status *</label>
//                 <select
//                   name="status"
//                   className={`form-control ${errors.status ? 'is-invalid' : ''}`}
//                   value={formData.status}
//                   onChange={handleChange}
//                   required
//                 >
//                   <option value="inactive">Inactive</option>
//                   <option value="active">Active</option>
//                   <option value="expired">Expired</option>
//                 </select>
//                 {errors.status && (
//                   <div className="invalid-feedback">{errors.status}</div>
//                 )}
//               </div>
//               <div className="modal-footer">
//                 <button
//                   type="button"
//                   className="btn btn-secondary"
//                   onClick={onClose}
//                   disabled={isSubmitting}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="btn btn-primary"
//                   disabled={isSubmitting}
//                 >
//                   {isSubmitting ? 'Updating...' : 'Update License'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditLicenseModal;