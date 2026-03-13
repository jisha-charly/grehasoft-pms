import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

interface Project {
  id: number;
  name: string;
}

interface Domain {
  id: number;
  domain_name: string;
}

interface Credential {
  id: number;
  project_name: string;
  domain_name: string;
  admin_url: string;
  admin_username: string;
}

const CredentialsPage = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    project: "",
    domain: "",
    admin_url: "",
    admin_username: "",
    admin_password: "",
    cpanel_url: "",
    cpanel_username: "",
    cpanel_password: "",
    ftp_host: "",
    ftp_username: "",
    ftp_password: "",
    client_email: "",
    client_email_password: "",
    notes: ""
  });

  useEffect(() => {
    fetchCredentials();
    fetchProjects();
    fetchDomains();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await axiosInstance.get("/infrastructure/credentials/");
      setCredentials(res.data.results || res.data);
    } catch (error) {
      console.error("Error fetching credentials", error);
    }
  };

  const fetchProjects = async () => {
    const res = await axiosInstance.get("/projects/");
    setProjects(res.data.results || res.data);
  };

  const fetchDomains = async () => {
    const res = await axiosInstance.get("/infrastructure/domains/");
    setDomains(res.data.results || res.data);
  };

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        project: Number(form.project),
        domain: Number(form.domain)
      };

      await axiosInstance.post("/infrastructure/credentials/", payload);

      setShowModal(false);
      fetchCredentials();

      setForm({
        project: "",
        domain: "",
        admin_url: "",
        admin_username: "",
        admin_password: "",
        cpanel_url: "",
        cpanel_username: "",
        cpanel_password: "",
        ftp_host: "",
        ftp_username: "",
        ftp_password: "",
        client_email: "",
        client_email_password: "",
        notes: ""
      });

    } catch (error: any) {
      console.error(error.response?.data);
      alert("Error saving credential");
    }
  };

  return (
    <div className="container mt-4">

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Website Credentials</h3>

        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Add Credential
        </button>
      </div>

      {/* TABLE */}

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Project</th>
            <th>Domain</th>
            <th>Admin URL</th>
            <th>Admin Username</th>
          </tr>
        </thead>

        <tbody>

          {credentials.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center">
                No credentials found
              </td>
            </tr>
          )}

          {credentials.map((cred) => (
            <tr key={cred.id}>
              <td>{cred.project_name}</td>
              <td>{cred.domain_name}</td>
              <td>{cred.admin_url}</td>
              <td>{cred.admin_username}</td>
            </tr>
          ))}

        </tbody>
      </table>

      {/* MODAL */}

      {showModal && (
        <div className="modal show d-block">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">

              <div className="modal-header">
                <h5>Add Website Credential</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>

           <div className="modal-body">

  {/* Project */}
  <label>Project</label>
  <select
    className="form-control mb-2"
    name="project"
    value={form.project}
    onChange={handleChange}
  >
    <option value="">Select Project</option>
    {projects.map((p) => (
      <option key={p.id} value={p.id}>
        {p.name}
      </option>
    ))}
  </select>

  {/* Domain */}
  <label>Domain</label>
  <select
    className="form-control mb-3"
    name="domain"
    value={form.domain}
    onChange={handleChange}
  >
    <option value="">Select Domain</option>
    {domains.map((d) => (
      <option key={d.id} value={d.id}>
        {d.domain_name}
      </option>
    ))}
  </select>

  <hr/>

  <h6>Admin Access</h6>

  <input
    className="form-control mb-2"
    name="admin_url"
    placeholder="Admin URL"
    value={form.admin_url}
    onChange={handleChange}
  />

  <input
    className="form-control mb-2"
    name="admin_username"
    placeholder="Admin Username"
    value={form.admin_username}
    onChange={handleChange}
  />

  <input
    type="password"
    className="form-control mb-3"
    name="admin_password"
    placeholder="Admin Password"
    value={form.admin_password}
    onChange={handleChange}
  />

  <hr/>

  <h6>cPanel Access</h6>

  <input
    className="form-control mb-2"
    name="cpanel_url"
    placeholder="cPanel URL"
    value={form.cpanel_url}
    onChange={handleChange}
  />

  <input
    className="form-control mb-2"
    name="cpanel_username"
    placeholder="cPanel Username"
    value={form.cpanel_username}
    onChange={handleChange}
  />

  <input
    type="password"
    className="form-control mb-3"
    name="cpanel_password"
    placeholder="cPanel Password"
    value={form.cpanel_password}
    onChange={handleChange}
  />

  <hr/>

  <h6>FTP Access</h6>

  <input
    className="form-control mb-2"
    name="ftp_host"
    placeholder="FTP Host"
    value={form.ftp_host}
    onChange={handleChange}
  />

  <input
    className="form-control mb-2"
    name="ftp_username"
    placeholder="FTP Username"
    value={form.ftp_username}
    onChange={handleChange}
  />

  <input
    type="password"
    className="form-control mb-3"
    name="ftp_password"
    placeholder="FTP Password"
    value={form.ftp_password}
    onChange={handleChange}
  />

  <hr/>

  <h6>Email Configuration</h6>

  <input
    className="form-control mb-2"
    name="client_email"
    placeholder="Client Email"
    value={form.client_email}
    onChange={handleChange}
  />

  <input
    type="password"
    className="form-control mb-3"
    name="client_email_password"
    placeholder="Client Email Password"
    value={form.client_email_password}
    onChange={handleChange}
  />

  <hr/>

  <label>Notes</label>
  <textarea
    className="form-control"
    name="notes"
    placeholder="Notes"
    value={form.notes}
    onChange={handleChange}
  />

</div>

              <div className="modal-footer">

                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  Save
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CredentialsPage;