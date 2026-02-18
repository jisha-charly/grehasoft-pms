import React, { useState } from 'react';
import { Task, TaskFile, TaskReview, User, UserRole } from '../types';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  files: TaskFile[];
  reviews: TaskReview[];
  users: User[];
  currentUser: User;
  onAddFile: (file: any) => void;
  onAddReview: (review: any) => void;
  onUpdateStatus: (id: string, status: any) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ 
  task, onClose, files, reviews, users, currentUser, onAddFile, onAddReview, onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'files'>('info');
  const [reviewForm, setReviewForm] = useState<{ fileId: number | null, comments: string, status: 'approved' | 'rework' }>({ fileId: null, comments: '', status: 'approved' });

  const taskFiles = files.filter(f => f.taskId === task.id);
  const getFileReviews = (fileId: number) => reviews.filter(r => r.taskFileId === fileId);

  const handleFileUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get('file') as File;
    if (file) {
      onAddFile({
        taskId: task.id,
        uploadedBy: currentUser.id,
        filePath: file.name,
        fileType: file.type,
        revisionNo: taskFiles.length + 1
      });
      e.currentTarget.reset();
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewForm.fileId) {
      onAddReview({
        taskFileId: reviewForm.fileId,
        reviewerId: currentUser.id,
        reviewedByRole: currentUser.role === UserRole.SUPER_ADMIN ? 'ADMIN' : 'PM',
        reviewVersion: getFileReviews(reviewForm.fileId).length + 1,
        comments: reviewForm.comments,
        status: reviewForm.status
      });
      setReviewForm({ fileId: null, comments: '', status: 'approved' });
    }
  };

  const isReviewer = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.PROJECT_MANAGER;

  return (
    <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          <div className="modal-header border-0 pb-0 pt-4 px-4 bg-white">
            <div>
              <span className="badge bg-primary-subtle text-primary mb-2 text-uppercase fw-bold" style={{fontSize: '0.6rem'}}>Task Execution Details</span>
              <h5 className="modal-title fw-bold text-dark">{task.title}</h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4 bg-white">
            <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
              <li className="nav-item">
                <button className={`nav-link fw-bold btn-sm ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Overview</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link fw-bold btn-sm d-flex align-items-center ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
                  Files & Reviews <span className="badge bg-light text-dark ms-2">{taskFiles.length}</span>
                </button>
              </li>
            </ul>

            {activeTab === 'info' && (
              <div className="row g-4">
                <div className="col-md-8">
                  <h6 className="fw-bold text-secondary small text-uppercase mb-2">Requirement Description</h6>
                  <p className="text-dark small lh-base">{task.description || 'No description provided.'}</p>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-2">Priority</h6>
                    <span className={`badge rounded-pill ${task.priority === 'high' ? 'bg-danger text-white' : task.priority === 'medium' ? 'bg-warning text-dark' : 'bg-info text-white'}`}>{task.priority.toUpperCase()}</span>
                  </div>
                  <div className="mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-2">Current Status</h6>
                    <select 
                      className="form-select form-select-sm" 
                      defaultValue={task.status} 
                      onChange={(e) => onUpdateStatus(task.id, { status: e.target.value })}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Completed</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-2">Target Date</h6>
                    <div className="small fw-bold text-dark"><i className="bi bi-calendar3 me-2 text-primary"></i>{task.dueDate}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="row g-4">
                <div className="col-md-7">
                  <h6 className="fw-bold mb-3 small uppercase text-secondary">Uploaded Assets</h6>
                  {taskFiles.length === 0 ? (
                    <div className="text-center py-5 border border-dashed rounded-3 text-muted small">No deliverables uploaded yet.</div>
                  ) : (
                    <div className="list-group list-group-flush border rounded-3 overflow-hidden">
                      {taskFiles.map(file => {
                        const fileReviews = getFileReviews(file.id);
                        const latestReview = fileReviews[fileReviews.length - 1];
                        return (
                          <div key={file.id} className="list-group-item file-item p-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="d-flex align-items-center">
                                <i className={`bi fs-3 me-3 text-primary ${file.fileType.includes('pdf') ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image'}`}></i>
                                <div>
                                  <div className="fw-bold small text-dark">{file.filePath}</div>
                                  <div className="smaller text-secondary">Version {file.revisionNo} • {file.uploadedAt}</div>
                                </div>
                              </div>
                              <div className="text-end">
                                {latestReview ? (
                                  <span className={`badge rounded-pill fw-bold ${latestReview.status === 'approved' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                    {latestReview.status.toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="badge rounded-pill bg-light text-secondary fw-bold border">PENDING</span>
                                )}
                                {isReviewer && (
                                  <button className="btn btn-sm btn-link text-primary p-0 ms-2 text-decoration-none fw-bold" onClick={() => setReviewForm({ ...reviewForm, fileId: file.id })}>Review</button>
                                )}
                              </div>
                            </div>
                            {fileReviews.length > 0 && (
                              <div className="mt-2 ps-5 border-start ms-4">
                                {fileReviews.map(review => (
                                  <div key={review.id} className="smaller p-2 bg-light rounded-2 mb-2">
                                    <div className="d-flex justify-content-between mb-1">
                                      <span className="fw-bold">{users.find(u => u.id === review.reviewerId)?.name}</span>
                                      <span className="text-muted" style={{fontSize: '0.65rem'}}>{review.reviewedAt}</span>
                                    </div>
                                    <div className="text-secondary">{review.comments}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="col-md-5">
                  <div className="card bg-light border-0 p-3 mb-4 rounded-3">
                    <h6 className="fw-bold mb-3 small text-uppercase text-secondary">Submit Deliverable</h6>
                    <form onSubmit={handleFileUpload}>
                      <input name="file" type="file" className="form-control form-control-sm mb-3" required />
                      <button type="submit" className="btn btn-primary btn-sm fw-bold w-100 py-2 shadow-sm">Upload Revision</button>
                    </form>
                  </div>

                  {reviewForm.fileId && (
                    <div className="card bg-white border shadow-sm p-3 rounded-3">
                      <h6 className="fw-bold mb-3 small text-uppercase text-primary">Review: {taskFiles.find(f => f.id === reviewForm.fileId)?.filePath}</h6>
                      <form onSubmit={handleReviewSubmit}>
                        <div className="mb-3">
                          <label className="form-label smaller fw-bold text-secondary uppercase">Feedback Comments</label>
                          <textarea className="form-control form-control-sm border-light bg-light" rows={3} value={reviewForm.comments} onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})} required placeholder="Provide clear rework instructions or approval notes..."></textarea>
                        </div>
                        <div className="mb-3">
                          <label className="form-label smaller fw-bold text-secondary uppercase">Status Decision</label>
                          <div className="d-flex gap-2">
                            <button type="button" className={`btn btn-sm flex-grow-1 fw-bold ${reviewForm.status === 'approved' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setReviewForm({...reviewForm, status: 'approved'})}>Approve</button>
                            <button type="button" className={`btn btn-sm flex-grow-1 fw-bold ${reviewForm.status === 'rework' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setReviewForm({...reviewForm, status: 'rework'})}>Rework</button>
                          </div>
                        </div>
                        <div className="d-flex gap-2 mt-4">
                          <button type="button" className="btn btn-light btn-sm flex-grow-1 fw-bold" onClick={() => setReviewForm({fileId: null, comments: '', status: 'approved'})}>Discard</button>
                          <button type="submit" className="btn btn-dark btn-sm flex-grow-1 fw-bold">Publish Review</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer border-0 p-4 pt-0 bg-white">
            <button className="btn btn-light fw-bold px-4 border" onClick={onClose}>Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;