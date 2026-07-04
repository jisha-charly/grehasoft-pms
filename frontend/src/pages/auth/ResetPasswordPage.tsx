import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAlert } from "../../hooks/useAlert";
import { AlertVariant } from "../../types/alert";

const ResetPasswordPage = () => {
  const { showAlert } = useAlert();
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");

  const resetPassword = async () => {
    try {
      await axiosInstance.post("/password_reset/confirm/", {
        token: token,
        password: password
      });

      await showAlert({
        variant: AlertVariant.SUCCESS,
        message: "Password updated"
      });
      navigate("/login");
    } catch {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to reset password. The link may have expired."
      });
    }
  };

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center">

      <div className="card p-4 shadow" style={{width:"400px"}}>
        <h4>Reset Password</h4>

        <input
          type="password"
          className="form-control my-3"
          placeholder="New Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button className="btn btn-primary w-100" onClick={resetPassword}>
          Reset Password
        </button>

      </div>

    </div>
  );
};

export default ResetPasswordPage;