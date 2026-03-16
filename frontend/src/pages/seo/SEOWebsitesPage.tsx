
import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { Plus, Trash2, Pencil } from "lucide-react";

const SEOWebsitesPage: React.FC = () => {

  const [websites,setWebsites] = useState<any[]>([]);
  const [clients,setClients] = useState<any[]>([]);
  const [showModal,setShowModal] = useState(false);

  const [editingId,setEditingId] = useState<number|null>(null);

  const [form,setForm] = useState({
    client:"",
    domain:"",
    google_search_console_id:"",
    google_analytics_id:"",
    sitemap_url:""
  });

  const fetchWebsites = async () => {
    const res = await axiosInstance.get("/websites/");
    setWebsites(res.data.results);
  };

  const fetchClients = async () => {
    const res = await axiosInstance.get("/clients/");
    setClients(res.data.results || res.data);
  };

  useEffect(()=>{
    fetchWebsites();
    fetchClients();
  },[]);

  const handleChange = (e:any)=>{
    setForm({...form,[e.target.name]:e.target.value});
  };

  const saveWebsite = async ()=>{

    if(editingId){
      await axiosInstance.put(`/websites/${editingId}/`,form);
    }else{
      await axiosInstance.post("/websites/",form);
    }

    setShowModal(false);
    setEditingId(null);

    setForm({
      client:"",
      domain:"",
      google_search_console_id:"",
      google_analytics_id:"",
      sitemap_url:""
    });

    fetchWebsites();
  };

  const editWebsite = (site:any)=>{
    setEditingId(site.id);
    setForm(site);
    setShowModal(true);
  };

  const deleteWebsite = async (id:number)=>{
    if(window.confirm("Delete this website?")){
      await axiosInstance.delete(`/websites/${id}/`);
      fetchWebsites();
    }
  };

  return (

  <div className="container-fluid py-4">

    <div className="d-flex justify-content-between align-items-center mb-4">

      <h4 className="fw-bold">SEO Websites</h4>

      <button
        className="btn btn-primary"
        onClick={()=>setShowModal(true)}
      >
        <Plus size={16} className="me-2"/>
        Add Website
      </button>

    </div>

    <div className="card shadow-sm border-0">

      <div className="table-responsive">

        <table className="table align-middle">

          <thead className="table-light">

            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Domain</th>
              <th>Search Console</th>
              <th>Analytics</th>
              <th>Sitemap</th>
              <th></th>
            </tr>

          </thead>

          <tbody>

          {websites.map(site=>(
            <tr key={site.id}>

              <td>{site.id}</td>
              <td>{site.client_name}</td>
              <td>{site.domain}</td>
              <td>{site.google_search_console_id}</td>
              <td>{site.google_analytics_id}</td>
              <td>{site.sitemap_url}</td>

              <td className="text-end">

                <button
                  className="btn btn-sm btn-light me-2"
                  onClick={()=>editWebsite(site)}
                >
                  <Pencil size={16}/>
                </button>

                <button
                  className="btn btn-sm btn-light text-danger"
                  onClick={()=>deleteWebsite(site.id)}
                >
                  <Trash2 size={16}/>
                </button>

              </td>

            </tr>
          ))}

          </tbody>

        </table>

      </div>

    </div>


{/* MODAL */}

{showModal && (

<div className="modal show d-block">

<div className="modal-dialog modal-dialog-centered">

<div className="modal-content">

<div className="modal-header">
<h5 className="modal-title">
{editingId ? "Edit Website":"Add Website"}
</h5>

<button
className="btn-close"
onClick={()=>setShowModal(false)}
></button>
</div>

<div className="modal-body">

<div className="mb-3">

<label className="form-label">Client</label>

<select
className="form-select"
name="client"
value={form.client}
onChange={handleChange}
>

<option value="">Select Client</option>

{clients.map((c:any)=>(
<option key={c.id} value={c.id}>
{c.company_name}
</option>
))}

</select>

</div>

<div className="mb-3">

<label className="form-label">Domain</label>

<input
className="form-control"
name="domain"
value={form.domain}
onChange={handleChange}
/>

</div>

<div className="mb-3">

<label className="form-label">Search Console ID</label>

<input
className="form-control"
name="google_search_console_id"
value={form.google_search_console_id}
onChange={handleChange}
/>

</div>

<div className="mb-3">

<label className="form-label">Google Analytics ID</label>

<input
className="form-control"
name="google_analytics_id"
value={form.google_analytics_id}
onChange={handleChange}
/>

</div>

<div className="mb-3">

<label className="form-label">Sitemap URL</label>

<input
className="form-control"
name="sitemap_url"
value={form.sitemap_url}
onChange={handleChange}
/>

</div>

</div>

<div className="modal-footer">

<button
className="btn btn-secondary"
onClick={()=>setShowModal(false)}
>
Cancel
</button>

<button
className="btn btn-primary"
onClick={saveWebsite}
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

export default SEOWebsitesPage;

