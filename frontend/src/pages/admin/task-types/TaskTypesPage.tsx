
import React, { useState, useMemo, useEffect } from 'react';
import { TaskType } from '../../../types';
import { useForm } from '../../../hooks/useForm';
import FormField from '../../../components/FormField';

interface TaskTypesPageProps {
  taskTypes: TaskType[];
  crud: any;
}

const TaskTypesPage: React.FC<TaskTypesPageProps> = ({ taskTypes, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TaskType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
const [typeToDelete, setTypeToDelete] = useState<any | null>(null);
  const filteredTypes = useMemo(() => {
    return taskTypes.filter(tt => 
      tt.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (tt.description && tt.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [taskTypes, searchTerm]);

  const validationSchema = {
    name: { required: true, message: 'Classification name is required.' },
    description: { required: true, message: 'Description is required.' }
  };

  const { values, errors, isSubmitting, handleChange, handleSubmit, resetForm, setValues } = useForm({
    initialValues: {
      name: '',
      description: ''
    },
    validationSchema,
    onSubmit: async (formData) => {
      const data = { 
        name: formData.name.toUpperCase(), 
        description: formData.description 
      };
      
      if (editingType) {
        await crud.update(editingType.id, data);
      } else {
        await crud.add(data);
      }
      setModalOpen(false);
      setEditingType(null);
    }
  });

  useEffect(() => {
    if (editingType) {
      setValues({
        name: editingType.name,
        description: editingType.description || ''
      });
    } else {
      resetForm();
    }
  }, [editingType, setValues, resetForm]);

  const handleOpenModal = (tt: TaskType | null = null) => {
    setEditingType(tt);
    setModalOpen(true);
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-0">
          <div>
            <h4 className="fw-bold mb-1 text-dark">Task Classifications</h4>
            <p className="text-secondary small mb-0">Define and manage categorical work types for project workflows</p>
          </div>
          <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={() => handleOpenModal(null)}>
            <i className="bi bi-tag-fill me-2"></i>Register Task Type
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
                  placeholder="Filter by name or description..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-8 text-end">
              <span className="text-secondary smaller fw-bold uppercase">System Types: {taskTypes.length}</span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-professional align-middle mb-0">
            <thead>
              <tr>
                <th className="px-4">Identifier</th>
                <th>Functional Description</th>
                <th>Created At</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="text-muted opacity-50">
                      <i className="bi bi-tags fs-1 d-block mb-3"></i>
                      No task types match your current selection.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTypes.map(tt => (
                  <tr key={tt.id} className="hover-bg-light transition">
                    <td className="px-4">
                      <span className="badge bg-light text-dark border px-3 py-2 font-monospace tracking-wide">
                        {tt.name}
                      </span>
                    </td>
                    <td>
                      <p className="small text-secondary mb-0 text-truncate" style={{ maxWidth: '400px' }} title={tt.description}>
                        {tt.description || 'No detailed description provided for this classification.'}
                      </p>
                    </td>
                    <td className="small text-muted">{tt.created_at
  ? new Date(tt.created_at).toLocaleDateString()
  : 'N/A'}</td>
                    <td className="text-end px-4">
                      <div className="btn-group shadow-sm rounded-3 overflow-hidden border">
                        <button className="btn btn-sm btn-white border-end" onClick={() => handleOpenModal(tt)} title="Configure Type">
                          <i className="bi bi-pencil-square text-primary"></i>
                        </button>
                        <button className="btn btn-sm btn-white" onClick={() => setTypeToDelete(tt)}title="Remove Type">
                          <i className="bi bi-trash3 text-danger"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingType ? <><i className="bi bi-gear-fill me-2"></i>Modify Classification</> : <><i className="bi bi-plus-circle-fill me-2"></i>New Classification</>}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <FormField
                    label="Classification Name *"
                    error={errors.name}
                    required
                  >
                    <input 
                      name="name" 
                      type="text" 
                      className="form-control form-control-lg border-light bg-light font-monospace" 
                      value={values.name} 
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. DEV, SEO, DESIGN" 
                      style={{ textTransform: 'uppercase' }}
                    />
                  </FormField>
                  <div className="form-text smaller text-muted mb-4">Use concise unique identifiers for reporting purposes.</div>

                  <div className="mb-0">
                    <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Description</label>
                    <textarea 
                      name="description" 
                      className={`form-control border-light bg-light ${errors.description ? 'is-invalid' : ''}`}
                      rows={4} 
                      value={values.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Explain the scope of tasks that fall under this classification..."
                    ></textarea>
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 py-2 border" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-dark fw-bold px-4 py-2 shadow-sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : (editingType ? 'Update Classification' : 'Register Type')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {typeToDelete && (
  <div className="modal show d-block bg-dark bg-opacity-50">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content border-0 rounded-4 shadow-lg">
        <div className="modal-header border-0">
          <h5 className="modal-title fw-bold text-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Confirm Revocation
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setTypeToDelete(null)}
          ></button>
        </div>

        <div className="modal-body">
          <p className="mb-0">
            Are you sure you want to revoke classification:
            <strong className="ms-1">{typeToDelete.name}</strong>?
          </p>
          <p className="text-muted small mt-2">
            This action can be reversed if soft delete is enabled.
          </p>
        </div>

        <div className="modal-footer border-0">
          <button
            className="btn btn-light"
            onClick={() => setTypeToDelete(null)}
          >
            Cancel
          </button>

          <button
            className="btn btn-danger"
            onClick={async () => {
              await crud.delete(typeToDelete.id);
              setTypeToDelete(null);
            }}
          >
            Revoke Type
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default TaskTypesPage;
