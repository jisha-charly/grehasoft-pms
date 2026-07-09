import React, { useState, useMemo, useEffect } from 'react';
import { Department } from '../../../types';
import { useForm } from '../../../hooks/useForm';
import { useCrud } from '../../../hooks/useCrud';
import FormField from '../../../components/FormField';

const DepartmentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    items: departments,
    pagination: { page, setPage, totalPages },
    add,
    update,
    delete: deleteDepartment,
  } = useCrud<Department>({
    endpoint: '/departments',
    queryParams: searchTerm ? { search: searchTerm } : undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const validationSchema = {
    name: { required: true, message: 'Department name is required.' }
  };

  const { values, errors, isSubmitting, handleChange, handleSubmit, resetForm, setValues } = useForm({
    initialValues: {
      name: '',
      parent: '' as string | number
    },
    validationSchema,
    onSubmit: async (formData) => {
      const data = {
        name: formData.name,
        parent: formData.parent ? Number(formData.parent) : null
      };
      
      if (editingDept) {
        await update(editingDept.id!, data);
      } else {
        await add(data);
      }
      setModalOpen(false);
      setEditingDept(null);
    }
  });

  useEffect(() => {
    if (editingDept) {
      setValues({
        name: editingDept.name,
        parent: editingDept.parent || ''
      });
    } else {
      resetForm();
    }
  }, [editingDept, setValues, resetForm]);

  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departments, searchTerm]);

  const handleOpenModal = (dept: Department | null = null) => {
    setEditingDept(dept);
    setModalOpen(true);
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-0">
          <div>
            <h4 className="fw-bold mb-1 text-dark">Organizational Units</h4>
            <p className="text-secondary small mb-0">Define corporate departments and functional sub-units</p>
          </div>
          <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={() => handleOpenModal(null)}>
            <i className="bi bi-diagram-3-fill me-2"></i>Create Department
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="row align-items-center">
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-0 px-3"><i className="bi bi-search text-muted"></i></span>
                <input 
                  type="text" 
                  className="form-control bg-light border-0 py-2" 
                  placeholder="Filter by name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-professional align-middle mb-0">
            <thead>
              <tr>
                <th className="px-4">Department Name</th>
                <th>Relationship</th>
                <th>Created At</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="text-muted opacity-50">
                      <i className="bi bi-diagram-2 fs-1 d-block mb-3"></i>
                      No departments match your search.
                    </div>
                  </td>
                </tr>
              ) : (
              departments.map(dept => {
                  return (
                    <tr key={dept.id} className="hover-bg-light transition">
                      <td className="px-4">
                        <div className="d-flex align-items-center">
                          {dept.parent && <i className="bi bi-arrow-return-right text-muted me-2 smaller"></i>}
                          <span className={`fw-bold ${dept.parent ? 'text-secondary small' : 'text-dark'}`}>{dept.name}</span>
                        </div>
                      </td>
                      <td>
                        {dept.parent ? (
                          <span className="badge bg-light text-primary border fw-normal py-1 px-2">
                            <i className="bi bi-layers me-1"></i>Sub Unit of {dept.parent_name}
                          </span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary border-0 fw-bold py-1 px-2 uppercase smaller">
                            Primary Unit
                          </span>
                        )}
                      </td>
                      <td className="small text-muted">
                        {dept.created_at ? new Date(dept.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="text-end px-4">
                        <div className="btn-group shadow-sm rounded-3 overflow-hidden border">
                          <button className="btn btn-sm btn-white border-end" onClick={() => handleOpenModal(dept)} title="Modify Configuration">
                            <i className="bi bi-pencil-square text-primary"></i>
                          </button>
                          <button className="btn btn-sm btn-white" onClick={() => setDepartmentToDelete(dept)} title="Remove Unit">
                            <i className="bi bi-trash3 text-danger"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="d-flex justify-content-end align-items-center gap-1 p-3">

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => setPage(1)}
  >
    « First
  </button>

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => setPage(page - 1)}
  >
    ‹ Prev
  </button>

  {pageNumbers.map(num => (
    <button
      key={num}
      className={`btn btn-sm ${page === num ? "btn-primary" : "btn-outline-primary"}`}
      onClick={() => setPage(num)}
    >
      {num}
    </button>
  ))}

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === totalPages}
    onClick={() => setPage(page + 1)}
  >
    Next ›
  </button>

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === totalPages}
    onClick={() => setPage(totalPages)}
  >
    Last »
  </button>

</div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingDept ? <><i className="bi bi-gear-wide me-2"></i>Edit Department</> : <><i className="bi bi-plus-circle me-2"></i>New Department</>}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <FormField
                    label="Unit Name *"
                    error={errors.name}
                    required
                  >
                    <input 
                      name="name" 
                      type="text" 
                      className="form-control form-control-lg border-light bg-light" 
                      value={values.name} 
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. Design Services" 
                    />
                  </FormField>
                  
                  <div className="mb-0">
                    <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Parent Division</label>
                    <select 
                      name="parent" 
                      className={`form-select form-select-lg border-light bg-light ${errors.parent ? 'is-invalid' : ''}`}
                      value={values.parent}
                      onChange={(e) => handleChange('parent', e.target.value)}
                    >
                      <option value="">None (Primary Department)</option>
                      {departments
                        .filter(d => d.id !== editingDept?.id) // Prevent self-parenting
                        .map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))
                      }
                    </select>
                    {errors.parent && <div className="invalid-feedback">{errors.parent}</div>}
                    <div className="form-text smaller text-muted">Nested departments help organize sub-services and specialized teams.</div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 py-2 border" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-dark fw-bold px-4 py-2 shadow-sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : (editingDept ? 'Update Details' : 'Confirm Definition')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {departmentToDelete && (
  <div className="modal show d-block bg-dark bg-opacity-50">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content border-0 rounded-4 shadow-lg">

        <div className="modal-header border-0">
          <h5 className="modal-title fw-bold text-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Confirm Deletion
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setDepartmentToDelete(null)}
          ></button>
        </div>

        <div className="modal-body">
          <p className="mb-0">
            Are you sure you want to delete:
            <strong className="ms-1">{departmentToDelete.name}</strong>?
          </p>
          <p className="text-muted small mt-2">
            This action can be restored if soft delete is enabled.
          </p>
        </div>

        <div className="modal-footer border-0">
          <button
            className="btn btn-light"
            onClick={() => setDepartmentToDelete(null)}
          >
            Cancel
          </button>

          <button
            className="btn btn-danger"
            onClick={async () => {
              await deleteDepartment(departmentToDelete.id);
              setDepartmentToDelete(null);
            }}
          >
            Delete Department
          </button>
        </div>

      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default DepartmentsPage;
