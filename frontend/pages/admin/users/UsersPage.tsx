
import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, Department, UserRole } from '../../../types';
import { useForm, ValidationSchema } from '../../../hooks/useForm';
import FormField from '../../../components/FormField';

interface UsersPageProps {
  users: User[];
  roles: Role[];
  departments: Department[];
  crud: any;
}

const UsersPage: React.FC<UsersPageProps> = ({ users, roles, departments, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const validationSchema: ValidationSchema<any> = {
    name: { required: true, message: 'Full name is required.' },
    username: { 
      required: true, 
      pattern: /^[a-zA-Z0-9_]+$/,
      message: 'System username is required and can only contain letters, numbers and underscores.' 
    },
    email: { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Enter a valid corporate email address.' 
    },
    password: { 
      validate: (v) => {
        if (!editingUser && !v) return 'Security password is required for new accounts.';
        if (v && v.length < 8) return 'Password must be at least 8 characters.';
        return true;
      },
      message: 'Password validation failed.'
    },
    role: { required: true, message: 'Please select an access role.' },
    departmentId: { required: true, message: 'Please choose a department.' }
  };

  const { values, errors, handleChange, handleSubmit, setValues, resetForm, isSubmitting } = useForm({
    initialValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      role: '' as UserRole,
      departmentId: '' as any,
      status: 'active' as 'active' | 'inactive'
    },
    validationSchema,
    onSubmit: async (formValues) => {
      const data = {
        ...formValues,
        departmentId: Number(formValues.departmentId)
      };

      if (editingUser) {
        await crud.update(editingUser.id, data);
      } else {
        await crud.add(data);
      }
      handleCloseModal();
    }
  });

  useEffect(() => {
    if (editingUser) {
      setValues({
        name: editingUser.name,
        username: editingUser.username,
        email: editingUser.email,
        password: '',
        role: editingUser.role,
        departmentId: editingUser.departmentId,
        status: editingUser.status
      });
    } else {
      resetForm();
    }
  }, [editingUser, setValues, resetForm]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    resetForm();
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-0">
          <div>
            <h4 className="fw-bold mb-1 text-dark">User Management</h4>
            <p className="text-secondary small mb-0">Administer system users, roles, and department access</p>
          </div>
          <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={() => { setEditingUser(null); setModalOpen(true); }}>
            <i className="bi bi-person-plus-fill me-2"></i>Provision Account
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
                  placeholder="Search by name, username or email..." 
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
                <th className="px-4">Identity</th>
                <th>Username</th>
                <th>Corporate Email</th>
                <th>Department</th>
                <th>System Role</th>
                <th>Status</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-people fs-1 opacity-25 d-block mb-3"></i>
                      <h6 className="fw-bold">No users found</h6>
                      <p className="small mb-0">Refine your search or create a new user profile.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover-bg-light transition">
                    <td className="px-4">
                      <div className="d-flex align-items-center">
                        <img src={`https://i.pravatar.cc/38?u=${u.id}`} className="rounded-circle me-3 border shadow-sm" alt="" />
                        <span className="fw-bold text-dark">{u.name}</span>
                      </div>
                    </td>
                    <td><code className="text-primary smaller fw-bold">@{u.username}</code></td>
                    <td className="small text-secondary">{u.email}</td>
                    <td>
                      <span className="badge bg-light text-dark border fw-normal">
                        {departments.find(d => d.id === u.departmentId)?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className="text-primary fw-bold smaller tracking-wider text-uppercase">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <div className="btn-group shadow-sm rounded-3 overflow-hidden border">
                        <button className="btn btn-sm btn-white border-end" onClick={() => handleEdit(u)} title="Edit User">
                          <i className="bi bi-pencil-square text-primary"></i>
                        </button>
                        <button className="btn btn-sm btn-white" onClick={() => { if(confirm('Permanently delete this user account?')) crud.delete(u.id); }} title="Delete User">
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
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingUser ? <><i className="bi bi-person-gear me-2"></i>Update User Account</> : <><i className="bi bi-person-plus me-2"></i>Provision New Account</>}
                  </h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <FormField label="Full Legal Name" error={errors.name} required>
                        <input 
                          name="name" 
                          className="form-control form-control-lg border-light bg-light" 
                          value={values.name} 
                          onChange={(e) => handleChange('name', e.target.value)}
                          placeholder="e.g. Alex Thompson" 
                        />
                      </FormField>
                    </div>
                    <div className="col-md-6">
                      <FormField label="System Username" error={errors.username} required>
                        <div className="input-group input-group-lg">
                          <span className={`input-group-text border-light bg-light text-muted ${errors.username ? 'border-danger' : ''}`}>@</span>
                          <input 
                            name="username" 
                            className="form-control border-light bg-light" 
                            value={values.username} 
                            onChange={(e) => handleChange('username', e.target.value)}
                            placeholder="username" 
                          />
                        </div>
                      </FormField>
                    </div>
                    <div className="col-md-6">
                      <FormField label="Corporate Email" error={errors.email} required>
                        <input 
                          name="email" 
                          type="email" 
                          className="form-control form-control-lg border-light bg-light" 
                          value={values.email} 
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="alex@grehasoft.com" 
                        />
                      </FormField>
                    </div>
                    <div className="col-md-6">
                      <FormField label={`Security Password ${editingUser ? '(Optional)' : ''}`} error={errors.password} required={!editingUser}>
                        <input 
                          name="password" 
                          type="password" 
                          className="form-control form-control-lg border-light bg-light" 
                          value={values.password} 
                          onChange={(e) => handleChange('password', e.target.value)}
                          placeholder="••••••••" 
                        />
                      </FormField>
                    </div>
                    <div className="col-md-6">
                      <FormField label="Access Role" error={errors.role} required>
                        <select 
                          name="role" 
                          className="form-select form-select-lg border-light bg-light" 
                          value={values.role} 
                          onChange={(e) => handleChange('role', e.target.value)}
                        >
                          <option value="">Assign a role...</option>
                          {Object.values(UserRole).map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                        </select>
                      </FormField>
                    </div>
                    <div className="col-md-6">
                      <FormField label="Assigned Department" error={errors.departmentId} required>
                        <select 
                          name="departmentId" 
                          className="form-select form-select-lg border-light bg-light" 
                          value={values.departmentId} 
                          onChange={(e) => handleChange('departmentId', e.target.value)}
                        >
                          <option value="">Choose department...</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </FormField>
                    </div>
                    <div className="col-12">
                      <FormField label="Account Visibility & Status">
                        <select 
                          name="status" 
                          className="form-select form-select-lg border-light bg-light" 
                          value={values.status} 
                          onChange={(e) => handleChange('status', e.target.value)}
                        >
                          <option value="active">Active - Full Platform Access</option>
                          <option value="inactive">Inactive - Account Suspended</option>
                        </select>
                      </FormField>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 py-2 border" onClick={handleCloseModal}>Discard</button>
                  <button type="submit" className="btn btn-dark fw-bold px-4 py-2 shadow-sm">
                    {editingUser ? 'Save Account Changes' : 'Confirm Provisioning'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
