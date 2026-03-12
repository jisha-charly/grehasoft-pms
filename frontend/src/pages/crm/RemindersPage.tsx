
import React, { useEffect, useState } from 'react';
import { Reminder, ReminderType } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface RemindersPageProps {
  reminders: Reminder[];
  crud: any;
}

const RemindersPage: React.FC<RemindersPageProps> = ({ reminders, crud }) => {
  const { user } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [reminderList, setReminderList] = useState<Reminder[]>(reminders || []);
const fetchReminders = async (pageNumber = 1) => {
  try {
    const res = await crud.getAll({
      page: pageNumber
    });

    setReminderList(res.results);
    setTotalPages(Math.ceil(res.count / 5)); // same PAGE_SIZE used in backend
    setPage(pageNumber);

  } catch (error) {
    console.error("Error fetching reminders:", error);
  }
};

const pageNumbers: number[] = [];

for (let i = 1; i <= totalPages; i++) {
  pageNumbers.push(i);
}
useEffect(() => {
  fetchReminders(page);
}, [page]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    crud.add({
      type: data.type as ReminderType,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      isCompleted: false,
      userId: user?.id
    });
    setModalOpen(false);
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

  const getUrgencyBadge = (dueDate: string, isCompleted: boolean) => {
    if (isCompleted) return null;
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
        <button className="btn btn-primary btn-sm shadow-sm" onClick={() => setModalOpen(true)}>
          <i className="bi bi-plus-lg me-2"></i>Add Reminder
        </button>
      </div>

      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {reminderList.length === 0? (
            <div className="text-center py-5 text-muted">No reminders scheduled</div>
          ) : (
            reminderList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(reminder => (
              <div key={reminder.id} className={`list-group-item p-4 border-start border-4 ${
                reminder.isCompleted ? 'border-light opacity-50' : 
                new Date(reminder.dueDate).toISOString().split('T')[0] < new Date().toISOString().split('T')[0] ? 'border-danger' :
                new Date(reminder.dueDate).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? 'border-warning' :
                'border-primary'
              }`}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-start">
                    <div className={`rounded-circle bg-light p-3 me-3 ${getReminderColor(reminder.type)}`}>
                      <i className={`bi ${getReminderIcon(reminder.type)} fs-4`}></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <h6 className={`fw-bold mb-0 ${reminder.isCompleted ? 'text-decoration-line-through' : ''}`}>
                          {reminder.title}
                        </h6>
                        {getUrgencyBadge(reminder.dueDate, reminder.isCompleted)}
                      </div>
                      <p className="text-secondary small mb-2">{reminder.description}</p>
                      <div className="d-flex align-items-center">
                        <span className={`badge bg-light text-dark border me-2 small fw-normal ${!reminder.isCompleted && reminder.dueDate < new Date().toISOString().split('T')[0] ? 'text-danger border-danger' : ''}`}>
                          <i className="bi bi-calendar-event me-1"></i>{reminder.dueDate}
                        </span>
                        <span className="badge bg-light text-dark border small fw-normal">
                          <i className="bi bi-tag me-1"></i>{reminder.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <button 
                      className={`btn btn-sm me-2 ${reminder.isCompleted ? 'btn-light' : 'btn-outline-success'}`}
                      onClick={() => crud.update(reminder.id, { isCompleted: !reminder.isCompleted })}
                    >
                      <i className={`bi ${reminder.isCompleted ? 'bi-arrow-counterclockwise' : 'bi-check-lg'}`}></i>
                      {reminder.isCompleted ? ' Reopen' : ' Complete'}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => crud.delete(reminder.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="d-flex justify-content-end align-items-center gap-1 p-3">

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => fetchReminders(1)}
  >
    « First
  </button>

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => fetchReminders(page - 1)}
  >
    ‹ Prev
  </button>

  {pageNumbers.map(num => (
    <button
      key={num}
      className={`btn btn-sm ${page === num ? "btn-primary" : "btn-outline-primary"}`}
      onClick={() => fetchReminders(num)}
    >
      {num}
    </button>
  ))}

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === totalPages}
    onClick={() => fetchReminders(page + 1)}
  >
    Next ›
  </button>

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === totalPages}
    onClick={() => fetchReminders(totalPages)}
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
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold">Add Reminder</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Type</label>
                    <select name="type" className="form-select" required>
                      <option value={ReminderType.GENERAL}>General</option>
                      <option value={ReminderType.INVOICE}>Invoice</option>
                      <option value={ReminderType.PAYMENT}>Payment</option>
                      <option value={ReminderType.PROPOSAL}>Proposal</option>
                      <option value={ReminderType.FOLLOWUP}>Follow-up</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Title</label>
                    <input name="title" type="text" className="form-control" placeholder="e.g. Send invoice to Acme" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Due Date</label>
                    <input name="dueDate" type="date" className="form-control" required />
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
    </div>
  );
};

export default RemindersPage;
