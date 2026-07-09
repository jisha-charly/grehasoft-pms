import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import FormField from "../../components/FormField";
import useAlert from "../../hooks/useAlert";
import { AlertVariant } from "../../types/alert";

type ClientData = {
  id: number;
  company_name: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

const ClientProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showAlert } = useAlert();
  
  // Profile state
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<any>({});
  
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingProfile, setSubmittingProfile] = useState<boolean>(false);
  const [submittingPassword, setSubmittingPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "danger"; text: string } | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await axiosInstance.get("/clients/");
        const clientList = res.data.results || res.data || [];
        if (clientList.length > 0) {
          const client = clientList[0];
          setClientData(client);
          setPhone(client.phone || "");
        }
        if (user?.profile_photo) {
          setPhotoPreview(user.profile_photo);
        }
      } catch (err) {
        console.error("Error loading client profile data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setMessage(null);

    try {
      // 1. Update phone number on Client model
      if (clientData) {
        await axiosInstance.patch(`/clients/${clientData.id}/`, {
          phone: phone.trim()
        });
      }

      // 2. Update profile photo on User model
      if (profilePhoto) {
        const formData = new FormData();
        formData.append("profile_photo", profilePhoto);
        const res = await axiosInstance.patch("/users/profile/", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        if (updateUser) {
          updateUser(res.data);
        }
      }

      setMessage({ type: "success", text: "Profile details updated successfully." });
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setMessage({ type: "danger", text: err.response?.data?.error || "Failed to update profile." });
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      showAlert({ variant: AlertVariant.ERROR, title: "Error", message: "Passwords do not match." });
      return;
    }

    setSubmittingPassword(true);
    try {
      await axiosInstance.post("/users/change-password/", {
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      showAlert({ variant: AlertVariant.SUCCESS, title: "Success", message: "Password changed successfully." });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || "Failed to change password.";
      setErrors({ currentPassword: errMsg });
      showAlert({ variant: AlertVariant.ERROR, title: "Error", message: errMsg });
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="mb-4 animate__animated animate__fadeIn">
        <h2 className="fw-bold text-dark mb-1">Your Profile</h2>
        <p className="text-muted mb-0">Manage password credentials, update phone numbers, and profile photo settings.</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show rounded-3 shadow-sm mb-4`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="row g-4 animate__animated animate__fadeInUp">
        {/* Profile Card & Read-Only Details */}
        <div className="col-lg-6">
          <form onSubmit={handleUpdateProfile}>
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-4">Edit Profile</h5>

              <div className="d-flex align-items-center mb-4">
                <div className="position-relative me-3">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Avatar"
                      className="rounded-circle border shadow-sm"
                      style={{ width: "80px", height: "80px", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: "80px", height: "80px", fontSize: "2rem" }}>
                      {user?.name ? user.name.charAt(0) : "C"}
                    </div>
                  )}
                  <label htmlFor="photo-upload" className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: "28px", height: "28px", cursor: "pointer" }}>
                    <i className="bi bi-camera-fill small"></i>
                  </label>
                  <input
                    type="file"
                    id="photo-upload"
                    className="d-none"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0">{user?.name}</h6>
                  <span className="small text-muted">{user?.email}</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary fw-bold">Company Name</label>
                <input
                  type="text"
                  className="form-control rounded-pill btn-sm bg-light"
                  value={clientData?.company_name || ""}
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary fw-bold">Email Address</label>
                <input
                  type="email"
                  className="form-control rounded-pill btn-sm bg-light"
                  value={clientData?.email || ""}
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary fw-bold">Phone Number</label>
                <input
                  type="text"
                  className="form-control rounded-pill btn-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="mb-4">
                <label className="form-label small text-secondary fw-bold">Billing Address</label>
                <textarea
                  className="form-control rounded-4 bg-light"
                  rows={3}
                  value={clientData?.address || ""}
                  disabled
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary rounded-pill w-100" disabled={submittingProfile}>
                {submittingProfile ? "Saving Details..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="col-lg-6">
          <form onSubmit={handleChangePassword}>
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-4">Change Password</h5>

              <FormField
                label="Current Password"
                name="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(_, val) => setCurrentPassword(val)}
                error={errors.currentPassword}
                required
              />

              <FormField
                label="New Password"
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(_, val) => setNewPassword(val)}
                error={errors.newPassword}
                required
              />

              <FormField
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(_, val) => setConfirmPassword(val)}
                error={errors.confirmPassword}
                required
              />

              <button type="submit" className="btn btn-outline-danger rounded-pill w-100 mt-2" disabled={submittingPassword}>
                {submittingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
