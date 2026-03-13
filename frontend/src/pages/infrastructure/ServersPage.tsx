import React, { useState } from "react"
import Layout from "../../components/layout/Layout"
import { useCrud } from "../../hooks/useCrud"
import { Server } from "../../types"

const ServersPage: React.FC = () => {

  const { items: servers, add, remove } = useCrud<Server>({
    endpoint: "/infrastructure/servers"
  })

  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    name: "",
    provider: "",
    owner: "",
    ip_address: "",
    notes: ""
  })

  const saveServer = async () => {

    if (!form.name) {
      alert("Server name required")
      return
    }

    await add(form)

    setShowModal(false)

    setForm({
      name: "",
      provider: "",
      owner: "",
      ip_address: "",
      notes: ""
    })
  }

  return (

    <Layout>

      <div className="container-fluid">

        <div className="d-flex justify-content-between mb-3">

          <div>
            <h3>Servers</h3>
            <small className="text-muted">
              Manage hosting servers
            </small>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Add Server
          </button>

        </div>

        <div className="card">

          <table className="table">

            <thead>

              <tr>
                <th>Name</th>
                <th>Provider</th>
                <th>IP</th>
                <th>Notes</th>
                <th style={{width:"120px"}}>Actions</th>
              </tr>

            </thead>

            <tbody>

              {servers.map(server => (

                <tr key={server.id}>

                  <td>{server.name}</td>
                  <td>{server.provider}</td>
                  <td>{server.ip_address}</td>
                  <td>{server.notes}</td>

                  <td>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => remove(server.id)}
                    >
                      Delete
                    </button>

                  </td>

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
                <h5>Add Server</h5>
              </div>

              <div className="modal-body">

                <input
                  className="form-control mb-2"
                  placeholder="Server Name"
                  value={form.name}
                  onChange={e => setForm({...form, name:e.target.value})}
                />

                <input
                  className="form-control mb-2"
                  placeholder="Provider"
                  value={form.provider}
                  onChange={e => setForm({...form, provider:e.target.value})}
                />

                <input
                  className="form-control mb-2"
                  placeholder="Owner"
                  value={form.owner}
                  onChange={e => setForm({...form, owner:e.target.value})}
                />

                <input
                  className="form-control mb-2"
                  placeholder="IP Address"
                  value={form.ip_address}
                  onChange={e => setForm({...form, ip_address:e.target.value})}
                />

                <textarea
                  className="form-control"
                  placeholder="Notes"
                  value={form.notes}
                  onChange={e => setForm({...form, notes:e.target.value})}
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
                  onClick={saveServer}
                >
                  Save
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </Layout>

  )
}

export default ServersPage