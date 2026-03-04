import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

const ResetPasswordPage = () => {

  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");

  const resetPassword = async () => {
    await axiosInstance.post("/password_reset/confirm/", {
  token: token,
  password: password
});

    alert("Password updated");
    navigate("/login");
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