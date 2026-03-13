import React, { useState, useEffect } from "react";
import Layout from "../../components/layout/Layout";
import axiosInstance from "../../api/axiosInstance";
import { useCrud } from "../../hooks/useCrud";

const DomainsPage: React.FC = () => {

  const { items: domains, add, refetch } = useCrud<any>({
    endpoint: "/infrastructure/domains"
  });

  const [servers, setServers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    project: "",
    domain_name: "",
    provider: "",
    purchase_date: "",
    expiry_date: "",
    server: "",
    notes: ""
  });

  useEffect(() => {

    loadDropdowns();

  }, []);

  const loadDropdowns = async () => {

    const serverRes = await axiosInstance.get("/infrastructure/servers/");
    const projectRes = await axiosInstance.get("/projects/");

    setServers(serverRes.data.results || serverRes.data);
    setProjects(projectRes.data.results || projectRes.data);

  };

  const handleSubmit = async () => {

    if (!form.domain_name || !form.project) {
      alert("Domain name and project are required");
      return;
    }

    await add(form);

    setShowModal(false);

    refetch();

    setForm({
      project: "",
      domain_name: "",
      provider: "",
      purchase_date: "",
      expiry_date: "",
      server: "",
      notes: ""
    });

  };

  return (

    <Layout>

      <div className="container-fluid">

        <div className="d-flex justify-content-between mb-3">

          <h3>Domains</h3>

          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Add Domain
          </button>

        </div>

        <div className="card">

          <table className="table">

            <thead>

              <tr>
                <th>Domain</th>
                <th>Project</th>
                <th>Server</th>
                <th>Expiry</th>
              </tr>

            </thead>

            <tbody>

              {domains.map((d: any) => (

                <tr key={d.id}>

                  <td>{d.domain_name}</td>

                  <td>{d.project_name}</td>

                  <td>{d.server_name}</td>

                  <td>{d.expiry_date}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {showModal && (

        <div className="modal d-block">

          <div className="modal-dialog">

            <div className="modal-content">

              <div className="modal-header">
                <h5>Add Domain</h5>
              </div>

              <div className="modal-body">

                <select
                  className="form-control mb-2"
                  value={form.project}
                  onChange={(e) =>
                    setForm({ ...form, project: e.target.value })
                  }
                >
                  <option value="">Select Project</option>

                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}

                </select>

                <input
                  className="form-control mb-2"
                  placeholder="Domain Name"
                  value={form.domain_name}
                  onChange={(e) =>
                    setForm({ ...form, domain_name: e.target.value })
                  }
                />

                <input
                  className="form-control mb-2"
                  placeholder="Provider"
                  value={form.provider}
                  onChange={(e) =>
                    setForm({ ...form, provider: e.target.value })
                  }
                />

                <label>Purchase Date</label>

                <input
                  type="date"
                  className="form-control mb-2"
                  value={form.purchase_date}
                  onChange={(e) =>
                    setForm({ ...form, purchase_date: e.target.value })
                  }
                />

                <label>Expiry Date</label>

                <input
                  type="date"
                  className="form-control mb-2"
                  value={form.expiry_date}
                  onChange={(e) =>
                    setForm({ ...form, expiry_date: e.target.value })
                  }
                />

                <select
                  className="form-control mb-2"
                  value={form.server}
                  onChange={(e) =>
                    setForm({ ...form, server: e.target.value })
                  }
                >
                  <option value="">Select Server</option>

                  {servers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}

                </select>

                <textarea
                  className="form-control"
                  placeholder="Notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
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

    </Layout>

  );

};

export default DomainsPage;