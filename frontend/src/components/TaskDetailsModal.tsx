import React, { useState, useEffect } from 'react';
import { Task, TaskFile, TaskReview, User, UserRole, TaskComment, TaskProgress, TaskAssignment } from '../types';
import axiosInstance from '../api/axiosInstance';
import { useForm } from '../hooks/useForm';
import FormField from './FormField';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onUpdateStatus: (id: number, status: any) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ 
  task, onClose, users, currentUser, onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'files' | 'comments'>('info');
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [reviews, setReviews] = useState<TaskReview[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [progress, setProgress] = useState<TaskProgress[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const fetchTaskData = async () => {
    setLoading(true);
    try {
      const [filesRes, commentsRes, reviewsRes] = await Promise.all([
        axiosInstance.get(`/task-files/?task=${task.id}`),
        axiosInstance.get(`/task-comments/?task=${task.id}`),
        axiosInstance.get(`/task-reviews/?task=${task.id}`), // only if backend supports filtering by task
      ]);

      setFiles(filesRes.data);
      setComments(commentsRes.data);
      setReviews(reviewsRes.data);

    } catch (error) {
      console.error("Error fetching task details:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchTaskData();
}, [task.id]);

  const latestProgress = progress.length > 0 ? progress[progress.length - 1] : { progressPercentage: 0 };

  const handleProgressUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = Number(e.target.value);
    try {
      const res = await axiosInstance.post('/task-progress', {
        taskId: task.id,
        progressPercentage: newPercentage,
        updatedBy: currentUser.id
      });
      setProgress(prev => [...prev, res.data]);
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

const getFileReviews = (fileId: number) =>
  reviews.filter(r => r.task_file === fileId);

  // File Upload Form
  const fileUploadForm = useForm({
    initialValues: { file: null as File | null },
   onSubmit: async (values) => {
  if (!values.file) return;

  const file = values.file;

  const sameNameFiles = files.filter(f => f.file_path === file.name);
  const nextRevision = sameNameFiles.length + 1;

  const formData = new FormData();
  formData.append("task", String(task.id));
  formData.append("uploaded_by", String(currentUser.id));
  formData.append("file", file);
  formData.append("revision_no", String(nextRevision));

  try {
    const res = await axiosInstance.post(
      "/task-files/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    setFiles(prev => [...prev, res.data]);
    fileUploadForm.resetForm();
  } catch (error) {
    console.error("Upload failed:", error);
  }
}
  });

  // Review Form
  const [reviewFileId, setReviewFileId] = useState<number | null>(null);
  const reviewForm = useForm({
    initialValues: { comments: '', status: 'approved' as 'approved' | 'rework' },
    validationSchema: {
      comments: { required: true, message: 'Feedback comments are required.' }
    },
    onSubmit: async (values) => {
      if (reviewFileId) {
       const payload = {
  task_file: reviewFileId,
  
  reviewed_by_role:
    currentUser.role_name === UserRole.SUPER_ADMIN? "ADMIN" : "PM",
  review_version: getFileReviews(reviewFileId).length + 1,
  comments: values.comments,
  status: values.status
};

        const res = await axiosInstance.post('/task-reviews/', payload);
        setReviews(prev => [...prev, res.data]);
        setReviewFileId(null);
        reviewForm.resetForm();
      }
    }
  });

  // Comment Form
  const commentForm = useForm({
    initialValues: { comment: '' },
    validationSchema: {
      comment: { required: true, message: 'Comment cannot be empty.' }
    },
    onSubmit: async (values) => {
      const res = await axiosInstance.post('/task-comments', {
        taskId: task.id,
        userId: currentUser.id,
        comment: values.comment
      });
      setComments(prev => [...prev, res.data]);
      commentForm.resetForm();
    }
  });

 const isReviewer =
  currentUser.role_name === UserRole.SUPER_ADMIN ||
  currentUser.role_name === UserRole.PROJECT_MANAGER;

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
                  Files & Reviews <span className="badge bg-light text-dark ms-2">{files.length}</span>
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link fw-bold btn-sm d-flex align-items-center ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
                  Comments <span className="badge bg-light text-dark ms-2">{comments.length}</span>
                </button>
              </li>
            </ul>

            {loading && <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>}

            {activeTab === 'info' && !loading && (
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
                  <div className="mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-2">Task Progress ({latestProgress.progressPercentage}%)</h6>
                    <input 
                      type="range" 
                      className="form-range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={latestProgress.progressPercentage}
                      onChange={handleProgressUpdate}
                    />
                  </div>
                  <div className="mb-3">
                    <h6 className="fw-bold text-secondary small text-uppercase mb-2">Assigned To</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {assignments.map(a => {
                        const user = users.find(u => u.id === a.employeeId);
                        const assigner = users.find(u => u.id === a.assignedBy);
                        return (
                          <div key={a.id} className="badge bg-light text-dark border fw-normal d-block w-100 text-start p-2 mb-1">
                            <div className="fw-bold">{user?.name}</div>
                            <div className="smaller text-muted">Assigned by {assigner?.name} on {new Date(a.assignedAt).toLocaleDateString()}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'files' && !loading && (
              <div className="row g-4">
                <div className="col-md-7">
                  <h6 className="fw-bold mb-3 small uppercase text-secondary">Uploaded Assets</h6>
                  {files.length === 0 ? (
                    <div className="text-center py-5 border border-dashed rounded-3 text-muted small">No deliverables uploaded yet.</div>
                  ) : (
                    <div className="list-group list-group-flush border rounded-3 overflow-hidden">
                      {files.map(file => {
                        const fileReviews = getFileReviews(file.id);
                        const latestReview = fileReviews[fileReviews.length - 1];
                        return (
                          <div key={file.id} className="list-group-item file-item p-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="d-flex align-items-center">
                                <i className={`bi fs-3 me-3 text-primary ${(file.file_type || '').includes('pdf') ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image'}`}></i>
                                <div>
                                  <div className="fw-bold small text-dark">{file.file_path}</div>
                                  <div className="smaller text-secondary">Version {file.revision_no} • {file.uploaded_at}</div>
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
                                {isReviewer && !latestReview?.status?.includes("approved")  && (
                                  <button className="btn btn-sm btn-link text-primary p-0 ms-2 text-decoration-none fw-bold" onClick={() => setReviewFileId(file.id)}>Review</button>
                                )}
                              </div>
                            </div>
                            {fileReviews.length > 0 && (
                              <div className="mt-2 ps-5 border-start ms-4">
                                {fileReviews.map(review => (
                                  <div key={review.id} className="smaller p-2 bg-light rounded-2 mb-2">
                                    <div className="d-flex justify-content-between mb-1">
                                      <span className="fw-bold">{users.find(u => u.id === review.reviewer)?.name}</span>
                                      <span className="text-muted" style={{fontSize: '0.65rem'}}>{review.reviewed_at}</span>
                                    </div>
                                    <div className="text-secondary">{review.comments}</div>
                                      {/* 👇 ADD THIS PART HERE */}
    {review.reviewer === currentUser.id && (
      <button
        className="btn btn-sm btn-link text-danger p-0"
        onClick={async () => {
          try {
            await axiosInstance.delete(`/task-reviews/${review.id}/`);
            setReviews(prev =>
              prev.filter(r => r.id !== review.id)
            );
          } catch (err) {
            console.error("Delete failed", err);
          }
        }}
      >
        Delete
      </button>
    )}
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
                    <form onSubmit={fileUploadForm.handleSubmit} noValidate>
                      <input 
                        name="file" 
                        type="file" 
                        className="form-control form-control-sm mb-3" 
                        onChange={(e) => fileUploadForm.handleChange('file', e.target.files?.[0] || null)}
                      />
                      <button type="submit" className="btn btn-primary btn-sm fw-bold w-100 py-2 shadow-sm" disabled={fileUploadForm.isSubmitting}>
                        {fileUploadForm.isSubmitting ? 'Uploading...' : 'Upload Revision'}
                      </button>
                    </form>
                  </div>

                  {reviewFileId && (
                    <div className="card bg-white border shadow-sm p-3 rounded-3">
                      <h6 className="fw-bold mb-3 small text-uppercase text-primary">Review: {files.find(f => f.id === reviewFileId)?.file_path}</h6>
                      <form onSubmit={reviewForm.handleSubmit} noValidate>
                        <div className="mb-3">
                          <FormField
                            label="Feedback Comments"
                            name="comments"
                            type="textarea"
                            value={reviewForm.values.comments}
                            onChange={reviewForm.handleChange}
                            error={reviewForm.errors.comments}
                            placeholder="Provide clear rework instructions or approval notes..."
                            rows={3}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label smaller fw-bold text-secondary uppercase">Status Decision</label>
                          <div className="d-flex gap-2">
                            <button 
                              type="button" 
                              className={`btn btn-sm flex-grow-1 fw-bold ${reviewForm.values.status === 'approved' ? 'btn-success' : 'btn-outline-success'}`} 
                              onClick={() => reviewForm.handleChange('status', 'approved')}
                            >
                              Approve
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm flex-grow-1 fw-bold ${reviewForm.values.status === 'rework' ? 'btn-danger' : 'btn-outline-danger'}`} 
                              onClick={() => reviewForm.handleChange('status', 'rework')}
                            >
                              Rework
                            </button>
                          </div>
                        </div>
                        <div className="d-flex gap-2 mt-4">
                          <button type="button" className="btn btn-light btn-sm flex-grow-1 fw-bold" onClick={() => { setReviewFileId(null); reviewForm.resetForm(); }}>Discard</button>
                          <button type="submit" className="btn btn-dark btn-sm flex-grow-1 fw-bold" disabled={reviewForm.isSubmitting}>
                            {reviewForm.isSubmitting ? 'Publishing...' : 'Publish Review'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comments' && !loading && (
              <div className="row g-4">
                <div className="col-md-12">
                  <h6 className="fw-bold mb-3 small uppercase text-secondary">Collaboration Thread</h6>
                  <div className="comments-container mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {comments.length === 0 ? (
                      <div className="text-center py-5 text-muted small border rounded-3 border-dashed">No comments yet. Start the conversation!</div>
                    ) : (
                      comments.map(c => (
                        <div key={c.id} className="d-flex mb-3">
                          <img src={`https://i.pravatar.cc/32?u=${c.userId}`} className="rounded-circle me-3 border shadow-sm" style={{ width: '32px', height: '32px' }} alt="" />
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold small text-dark">{users.find(u => u.id === c.userId)?.name}</span>
                              <span className="text-muted" style={{ fontSize: '0.65rem' }}>{c.createdAt}</span>
                            </div>
                            <div className="p-2 bg-light rounded-3 small text-dark">{c.comment}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={commentForm.handleSubmit} noValidate>
                    <div className="input-group">
                      <input 
                        type="text" 
                        className={`form-control border-light bg-light ${commentForm.errors.comment ? 'border-danger' : ''}`} 
                        placeholder="Type your message..." 
                        value={commentForm.values.comment}
                        onChange={(e) => commentForm.handleChange('comment', e.target.value)}
                      />
                      <button className="btn btn-primary fw-bold" type="submit" disabled={commentForm.isSubmitting}>
                        {commentForm.isSubmitting ? '...' : 'Send'}
                      </button>
                    </div>
                    {commentForm.errors.comment && <div className="text-danger smaller mt-1">{commentForm.errors.comment}</div>}
                  </form>
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