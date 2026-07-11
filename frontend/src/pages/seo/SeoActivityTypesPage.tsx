import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAlert } from "../../hooks/useAlert";
import { AlertVariant } from "../../types/alert";
import { SEOActivityType } from "../../types";
import { Plus, Search, Edit3, Trash2 } from "lucide-react";
import { getErrorMessage } from "../../utils/getErrorMessage";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";

const SeoActivityTypesPage: React.FC = () => {
  const { showAlert } = useAlert();
  const [activityTypes, setActivityTypes] = useState<SEOActivityType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
    display_order: 0
  });

  // Deletion Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/seo/activity-types/");
      setActivityTypes(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching activity types:", err);
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to load activity types."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      if (editingId) {
        await axiosInstance.put(`/seo/activity-types/${editingId}/`, form);
        showAlert({
          variant: AlertVariant.SUCCESS,
          message: "Activity type updated successfully."
        });
      } else {
        await axiosInstance.post("/seo/activity-types/", form);
        showAlert({
          variant: AlertVariant.SUCCESS,
          message: "Activity type created successfully."
        });
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ name: "", description: "", is_active: true, display_order: 0 });
      fetchActivities();
    } catch (err: any) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: getErrorMessage(err)
      });
    }
  };

  const handleEdit = (act: SEOActivityType) => {
    setEditingId(act.id);
    setForm({
      name: act.name,
      description: act.description || "",
      is_active: act.is_active,
      display_order: act.display_order || 0
    });
    setShowModal(true);
  };

  const handleToggleActive = async (act: SEOActivityType) => {
    try {
      await axiosInstance.patch(`/seo/activity-types/${act.id}/`, {
        is_active: !act.is_active
      });
      showAlert({
        variant: AlertVariant.SUCCESS,
        message: `Activity type ${!act.is_active ? "activated" : "deactivated"} successfully.`
      });
      fetchActivities();
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to toggle status."
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId === null) return;
    try {
      setIsDeleting(true);
      await axiosInstance.delete(`/seo/activity-types/${deletingId}/`);
      showAlert({
        variant: AlertVariant.SUCCESS,
        message: "Activity type deleted successfully."
      });
      setShowDeleteModal(false);
      setDeletingId(null);
      fetchActivities();
    } catch (err: any) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: getErrorMessage(err) || "Failed to delete activity type. It might be linked to historical records."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredActivities = activityTypes.filter(
    act =>
      act.name.toLowerCase().includes(search.toLowerCase()) ||
      (act.description && act.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h5 className="fw-bold mb-1">SEO Activity Types</h5>
          <p className="text-muted small mb-0">Manage global activity types for monthly targets, work logs, and reports.</p>
        </div>
        <button
          className="btn btn-primary shadow-sm rounded-3 px-3 py-2 d-flex align-items-center mt-3 mt-md-0"
          onClick={() => {
            setEditingId(null);
            setForm({ name: "", description: "", is_active: true, display_order: 0 });
            setShowModal(true);
          }}
        >
          <Plus size={16} className="me-2" /> Add Activity Type
        </button>
      </div>

      <div className="input-group mb-4 shadow-sm rounded-3 overflow-hidden border">
        <span className="input-group-text bg-white border-0 text-muted">
          <Search size={18} />
        </span>
        <input
          type="text"
          className="form-control border-0"
          placeholder="Search activity types..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-5 text-muted bg-light border rounded-3">No activity types found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle border">
            <thead className="table-light">
              <tr>
                <th>Activity Name</th>
                <th>Description</th>
                <th className="text-center">Display Order</th>
                <th className="text-center">Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map(act => (
                <tr key={act.id}>
                  <td className="fw-bold">{act.name}</td>
                  <td>{act.description || <span className="text-muted small">-</span>}</td>
                  <td className="text-center">
                    <span className="badge bg-light text-dark border px-2 py-1.5 font-monospace">{act.display_order ?? 0}</span>
                  </td>
                  <td className="text-center">
                    <button
                      className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${act.is_active ? "btn-success" : "btn-secondary"}`}
                      onClick={() => handleToggleActive(act)}
                    >
                      {act.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-light me-1" onClick={() => handleEdit(act)} title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => handleDeleteClick(act.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-light border-0 px-4 py-3">
                  <h5 className="fw-bold mb-0">{editingId ? "Edit Activity Type" : "Add Activity Type"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">ACTIVITY NAME *</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Guest Posting"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">DESCRIPTION</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="e.g. Submitting guest articles to external domains."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">DISPLAY ORDER</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.display_order}
                      onChange={e => setForm({ ...form, display_order: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-check form-switch mt-3 mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={form.is_active}
                      onChange={e => setForm({ ...form, is_active: e.target.checked })}
                      id="activityActiveSwitch"
                    />
                    <label className="form-check-label fw-semibold text-dark" htmlFor="activityActiveSwitch">
                      Is Active
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 py-3 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">Save Activity Type</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
            setDeletingId(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Activity Type"
        message={
          <>
            <p className="mb-2">Are you sure you want to delete this activity type?</p>
            <p className="mb-0 text-secondary small">
              If this activity type has already been used in monthly targets, work logs, or reports, deleting it may affect historical data.
            </p>
          </>
        }
        confirmText="Delete"
        isLoading={isDeleting}
        isDisabled={isDeleting}
        autoCloseOnConfirm={false}
        showSoftDeleteNotice={false}
      />
    </div>
  );
};

export default SeoActivityTypesPage;
