import React, { useState } from 'react';
import { Reminder, ReminderType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCrud } from '../../hooks/useCrud';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

const RemindersPage: React.FC = () => {
  const { user } = useAuth();
  const {
    items: reminderList,
    pagination: { page, setPage, totalPages },
    add,
    update,
    delete: deleteReminder,
  } = useCrud<Reminder>({ endpoint: '/reminders' });

  const [isModalOpen, setModalOpen] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);

  const validateReminder = (fd: FormData) => {
    let newErrors: any = {};
    const type = fd.get("type")?.toString().trim();
    const title = fd.get("title")?.toString().trim();
    const dueDate = fd.get("due_date")?.toString();

    if (!type) {
      newErrors.type = "Please select reminder type";
    }

    if (!title) {
      newErrors.title = "Title is required";
    } else if (title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!dueDate) {
      newErrors.due_date = "Due date is required";
    } else {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.due_date = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!validateReminder(formData)) return;
    
    const data = Object.fromEntries(formData.entries());

    try {
      await add({
        type: data.type as ReminderType,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        is_completed: false,
      } as any);
      setModalOpen(false);
      setErrors({});
    } catch (error: any) {
      if (error.response && error.response.data) {
        const resData = error.response.data;
        let newErrors: any = {};
        if (resData.title) newErrors.title = resData.title[0];
        if (resData.due_date) newErrors.due_date = resData.due_date[0];
        if (resData.type) newErrors.type = resData.type[0];
        setErrors(newErrors);
      }
    }
  };

  const getReminderIcon = (type: ReminderType) => {
    switch (type) {
      case ReminderType.INVOICE: return 'bi-receipt';
      case ReminderType.PAYMENT: return 'bi-currency-dollar';
      case ReminderType.PROPOSAL: return 'bi-file-earmark-text';
      case ReminderType.FOLLOWUP: return 'bi-person-lines-fill';
      default: return 'bi-bell';
    }
  };

  const getReminderColor = (type: ReminderType) => {
    switch (type) {
      case ReminderType.INVOICE: return 'text-primary';
      case ReminderType.PAYMENT: return 'text-success';
      case ReminderType.PROPOSAL: return 'text-info';
      case ReminderType.FOLLOWUP: return 'text-warning';
      default: return 'text-secondary';
    }
  };

  const getUrgencyBadge = (dueDate: string, is_completed: boolean) => {
    if (is_completed) return null;
    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) return <span className="badge bg-danger ms-2">OVERDUE</span>;
    if (dueDate === today) return <span className="badge bg-warning text-dark ms-2">DUE TODAY</span>;
    return null;
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0">Reminders & Schedule</h4>
          <p className="text-secondary small mb-0">Track upcoming tasks and follow-ups</p>
        </div>
        <button className="btn btn-primary btn-sm shadow-sm" onClick={() => { setErrors({}); setModalOpen(true); }}>
          <i className="bi bi-plus-lg me-2"></i>Add Reminder
        </button>
      </div>

      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {reminderList.length === 0? (
            <div className="text-center py-5 text-muted">No reminders scheduled</div>
          ) : (
            reminderList.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map(reminder => (
              <div key={reminder.id} className={`list-group-item p-4 border-start border-4 ${
                reminder.is_completed ? 'border-light opacity-50' : 
                new Date(reminder.due_date).toISOString().split('T')[0] < new Date().toISOString().split('T')[0] ? 'border-danger' :
                new Date(reminder.due_date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? 'border-warning' :
                'border-primary'
              }`}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-start">
                    <div className={`rounded-circle bg-light p-3 me-3 ${getReminderColor(reminder.type)}`}>
                      <i className={`bi ${getReminderIcon(reminder.type)} fs-4`}></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <h6 className={`fw-bold mb-0 ${reminder.is_completed ? 'text-decoration-line-through' : ''}`}>
                          {reminder.title}
                        </h6>
                        {getUrgencyBadge(reminder.due_date, reminder.is_completed)}
                      </div>
                      <p className="text-secondary small mb-2">{reminder.description}</p>
                      <div className="d-flex align-items-center">
                        <span className={`badge bg-light text-dark border me-2 small fw-normal ${!reminder.is_completed && reminder.due_date< new Date().toISOString().split('T')[0] ? 'text-danger border-danger' : ''}`}>
                          <i className="bi bi-calendar-event me-1"></i>{reminder.due_date}
                        </span>
                        <span className="badge bg-light text-dark border small fw-normal">
                          <i className="bi bi-tag me-1"></i>{reminder.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <button 
                      className={`btn btn-sm me-2 ${reminder.is_completed ? 'btn-light' : 'btn-outline-success'}`}
                      onClick={() => update(reminder.id!, { is_completed: !reminder.is_completed })}
                    >
                      <i className={`bi ${reminder.is_completed ? 'bi-arrow-counterclockwise' : 'bi-check-lg'}`}></i>
                      {reminder.is_completed ? ' Reopen' : ' Complete'}
                    </button>
                    <button className="btn btn-sm btn-outline-danger"onClick={() => setReminderToDelete(reminder)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
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
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSubmit} noValidate onChange={(e: any) => {
                if (errors[e.target.name]) {
                  setErrors({ ...errors, [e.target.name]: null });
                }
              }}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold">Add Reminder</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Type *</label>
                    <select name="type" className={`form-select ${errors.type ? 'is-invalid' : ''}`} defaultValue="">
                      <option value="" disabled>Select Type</option>
                      <option value={ReminderType.GENERAL}>General</option>
                      <option value={ReminderType.INVOICE}>Invoice</option>
                      <option value={ReminderType.PAYMENT}>Payment</option>
                      <option value={ReminderType.PROPOSAL}>Proposal</option>
                      <option value={ReminderType.FOLLOWUP}>Follow-up</option>
                    </select>
                    {errors.type && <div className="invalid-feedback">{errors.type}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Title *</label>
                    <input name="title" type="text" className={`form-control ${errors.title ? 'is-invalid' : ''}`} placeholder="e.g. Send invoice to Acme" />
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Due Date *</label>
                    <input name="due_date" type="date" className={`form-control ${errors.due_date ? 'is-invalid' : ''}`} />
                    {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Description</label>
                    <textarea name="description" className="form-control" rows={3} placeholder="Additional details..."></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 shadow-sm">Save Reminder</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      <DeleteConfirmModal
  isOpen={!!reminderToDelete}
  title="Delete Reminder"
  message={`Are you sure you want to delete "${reminderToDelete?.title}"?`}
  onClose={() => setReminderToDelete(null)}
  onConfirm={async () => {
    if (!reminderToDelete) return;
    await deleteReminder(reminderToDelete.id!);
    setReminderToDelete(null);
  }}
/>
    </div>
  );
};

export default RemindersPage;
