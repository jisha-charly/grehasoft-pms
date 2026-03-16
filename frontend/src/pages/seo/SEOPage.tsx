import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";

import {
  Globe, Zap, TrendingUp, Shield, Download, Plus,
  BarChart3, Link2, Settings, MapPin, Users,
  CheckCircle2
} from "lucide-react";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid
} from "recharts";



const SEOPage: React.FC = () => {

  const [showModal, setShowModal] = useState(false);

  const [tasks, setTasks] = useState<any[]>([]);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [technicalSEO, setTechnicalSEO] = useState<any>(null);
  const [socialMedia, setSocialMedia] = useState<any[]>([]);

  const dashboardCache = useRef<any>({});

  const [description, setDescription] = useState("");

  const [taskType, setTaskType] = useState("ON_PAGE");




 const [clients, setClients] = useState<any[]>([]);
const [websites, setWebsites] = useState<any[]>([]);

const [selectedClient, setSelectedClient] = useState<number | null>(null);
const [selectedWebsite, setSelectedWebsite] = useState<number | null>(null);
const [chartData,setChartData] = useState([]);
const fetchClients = async () => {
  try {
    const res = await axiosInstance.get("/clients/");
    setClients(res.data.results || res.data);
  } catch (err) {
    console.error("Error loading clients", err);
  }
};
const fetchWebsites = async (clientId:number) => {

  try{

    const res = await axiosInstance.get(`/websites/?client=${clientId}`);

    setWebsites(res.data.results || res.data);

  }catch(err){

    console.error(err);

  }

};
useEffect(() => {
  fetchClients();
}, []);
  const fetchDashboard = async (websiteId: number) => {
    try {
      const res = await axiosInstance.get(`/seo-dashboard/?website=${websiteId}`);
      const data = res.data;
      setDashboardData(data);
      setTasks(data.tasks || []);
      setChartData(data.analytics || []);
      setBacklinks(data.backlinks || []);
      setKeywords(data.keywords || []);
      setTechnicalSEO(data.technical || null);
      setSocialMedia(data.social || []);
    } catch (err) {
      console.error("SEO dashboard load error", err);
    }
  };

  useEffect(() => {
    if (selectedWebsite) {
      fetchDashboard(selectedWebsite);
    }
  }, [selectedWebsite]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedWebsite) {
        fetchDashboard(selectedWebsite);
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [selectedWebsite]);  const createTask = async () => {
    if (!selectedClient || !selectedWebsite) {
      alert("Please select client and website");
      return;
    }

    try {
      const payload = {
        task_type: taskType,
        description: description,
        status: "ACTIVE",
        client: selectedClient,
        website: selectedWebsite
      };

      await axiosInstance.post("/seo-tasks/", payload);

      setShowModal(false);
      setDescription("");

      if (selectedWebsite) {
        fetchDashboard(selectedWebsite);
      }
    } catch (err) {
      console.error("SEO Task create error", err);
    }
  };



  return (

    <div className="container-fluid py-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>



      {/* FILTER BAR */}

      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">

        <div className="row g-3 align-items-center">

          <div className="col-md-3 border-end">

            <label className="small text-muted fw-bold d-block mb-1 text-uppercase">

              Client
  </label>
           <select
className="form-select form-select-sm border-0 bg-transparent fw-bold"
value={selectedClient || ""}
onChange={(e) => {

  const clientId = Number(e.target.value);

  setSelectedClient(clientId);

  fetchWebsites(clientId);

}}
>

<option value="">Select Client</option>

{clients.map((client:any)=>(
<option key={client.id} value={client.id}>
{client.company_name}
</option>
))}

</select>

          </div>



          <div className="col-md-3">

            <label className="small text-muted fw-bold d-block mb-1 text-uppercase">

              Website

            </label>

            <select
className="form-select form-select-sm border-0 bg-transparent fw-bold"
value={selectedWebsite || ""}
onChange={(e)=>setSelectedWebsite(Number(e.target.value))}
>

<option value="">Select Website</option>

{websites.map((site:any)=>(
<option key={site.id} value={site.id}>
{site.domain}
</option>
))}

</select>

          </div>



          <div className="col-md-6 text-md-end pt-2">

            <button className="btn btn-sm btn-outline-primary me-2 shadow-sm rounded-3 px-3">

              <Download size={14} className="me-1" /> Export Report

            </button>



            <button

              className="btn btn-sm btn-primary shadow-sm rounded-3 px-3"

              onClick={() => setShowModal(true)}

            >

              <Plus size={14} className="me-1" /> Add SEO Task

            </button>

          </div>

        </div>

      </div>



      {/* METRIC CARDS */}

      <div className="row g-4 mb-4">

        {[

          { title: "ON-PAGE SCORE", value: `${dashboardData?.metrics?.on_page_score ?? 0}%`, icon: <Globe size={20} />, color: "primary" },
          { title: "AVG LCP", value: `${dashboardData?.metrics?.avg_lcp ?? 0}s`, icon: <Zap size={20} />, color: "success" },
          { title: "RANKINGS UP", value: dashboardData?.metrics?.rankings_up ?? 0, icon: <TrendingUp size={20} />, color: "info" },
          { title: "SPAM SCORE", value: `${dashboardData?.metrics?.spam_score ?? 0}%`, icon: <Shield size={20} />, color: "warning" }

        ].map((m, i) => (

          <div key={i} className="col-md-6 col-xl-3">

            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">

              <div className={`p-3 bg-${m.color}-subtle text-${m.color} rounded-3 mb-3 d-inline-block`}>

                {m.icon}

              </div>

              <small className="text-muted fw-bold d-block">{m.title}</small>

              <h3 className="fw-bold mt-2 mb-0">{m.value}</h3>

            </div>

          </div>

        ))}

      </div>



      {/* ACTIVE SEO TASKS */}

      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">

        <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-white">

          <h5 className="fw-bold mb-0">Active SEO Tasks</h5>

        </div>



        <div className="table-responsive">

          <table className="table align-middle mb-0">

            <thead style={{ background: "#f8f9fc" }}>

              <tr>

                <th className="px-4 py-3 border-0 small text-muted">TASK ID</th>

                <th className="py-3 border-0 small text-muted">SEO TYPE</th>

                <th className="py-3 border-0 small text-muted">CREATED AT</th>

                <th className="px-4 py-3 border-0 text-end small text-muted">STATUS</th>

              </tr>

            </thead>



            {tasks.length > 0 && (
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 fw-bold text-dark">#{task.id}</td>

                  <td>
                    <span className="badge bg-info-subtle text-info fw-semibold px-3 py-2">
                       {task.task_type}
                    </span>
                  </td>

                  <td className="text-muted">
                    {new Date(task.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-4 text-end">
                    <span className="badge bg-success px-3 py-2">
                      <CheckCircle2 size={12} className="me-1" />
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            )}

          </table>

        </div>

      </div>



      
        {/* --- 4. VISIBILITY & AI AUDIT --- */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4"><BarChart3 size={18} className="me-2 text-primary" /> Search Visibility Trend</h5>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="traffic" stroke="#0d6efd" strokeWidth={3} fill="#0d6efd" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card border-0 text-white rounded-4 shadow-sm p-4 h-100" style={{ background: "linear-gradient(135deg, #1e293b 0%, #111827 100%)" }}>
                <h5 className="fw-bold mb-3">⚡ AI SEO Audit</h5>
                <p className="small text-white-50">Instant real-time analysis for <b>{selectedWebsite}</b>.</p>
                <div className="input-group mb-3">
                  <input className="form-control bg-dark border-secondary text-white" placeholder="https://example.com" />
                  <button className="btn btn-primary px-3">Audit</button>
                </div>
                <div className="mt-auto small text-white-50 p-2 bg-white bg-opacity-10 rounded text-center">
                  Suggested Fix: Optimize image alt tags on Home.
                </div>
              </div>
            </div>
          </div>
    
          {/* --- 5. OFF-PAGE & TECHNICAL --- */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-3"><Link2 size={18} className="me-2 text-primary" /> Off-Page Activity</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead className="small text-muted">
                      <tr><th>TYPE</th><th>URL</th><th>DA</th><th>STATUS</th></tr>
                    </thead>
                    {backlinks.length > 0 && (
                    <tbody>
                      {backlinks.map((link: any) => (
                        <tr key={link.id}>
                          <td>{link.type ?? "Backlink"}</td>
                          <td><a href={link.url} className="text-decoration-none text-primary fw-semibold">{link.url}</a></td>
                          <td><span className="fw-bold">{link.da ?? 'N/A'}</span></td>
                          <td><span className="badge bg-success-subtle text-success">{link.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                    )}
                  </table>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-3"><Settings size={18} className="me-2 text-primary" /> Technical SEO</h5>
                <div className="row g-3">
                  {[
                    { label: "Broken Links", val: technicalSEO?.broken_links ?? 0, color: "success" },
                    { label: "Sitemap", val: technicalSEO?.sitemap_status ?? "Pending", color: "primary" },
                    { label: "LCP", val: `${technicalSEO?.lcp ?? 0}s`, color: "dark" },
                    { label: "CLS", val: technicalSEO?.cls ?? 0, color: "dark" }
                  ].map((item, idx) => (
                    <div key={idx} className="col-6">
                      <div className="p-3 bg-light rounded-3 border border-white">
                        <small className="text-muted d-block small mb-1">{item.label}</small>
                        <h4 className={`fw-bold mb-0 text-${item.color}`}>{item.val}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
    
          {/* --- 6. KEYWORD & LOCAL SEO --- */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-3">Keyword Tracking</h5>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead className="small text-muted">
                      <tr><th>KEYWORD</th><th>POSITION</th><th>DIFFICULTY</th><th>RANK</th></tr>
                    </thead>
                    {keywords.length > 0 && (
                    <tbody>
                      {keywords.map((kw: any) => (
                        <tr key={kw.id}>
                          <td className="fw-semibold">{kw.keyword}</td>
                          <td className="text-muted">{kw.position ?? 0}</td>
                          <td className="text-muted">{kw.difficulty ?? 0}%</td>
                          <td><span className="badge bg-success-subtle text-success border border-success px-3">#{kw.rank ?? 0}</span></td>
                        </tr>
                      ))}
                    </tbody>
                    )}
                  </table>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-3"><MapPin size={18} className="me-2 text-primary" /> Local SEO (GMB)</h5>
                <div className="d-flex align-items-center mb-3">
                  <div className="p-2 bg-primary-subtle rounded-3 me-3 text-primary fw-bold">G</div>
                  <div>
                    <h6 className="fw-bold mb-0">Grehasoft Solutions</h6>
                    <small className="text-muted small">Software Company</small>
                  </div>
                </div>
                <div className="p-3 bg-light rounded-3 text-center mb-3 border border-white">
                  <div className="text-warning mb-1">⭐⭐⭐⭐⭐</div>
                  <span className="fw-bold fs-5">4.8</span> <small className="text-muted">(150 reviews)</small>
                </div>
                <button className="btn btn-outline-primary w-100 btn-sm rounded-3">Connect New Profile</button>
              </div>
            </div>
          </div>
    
          {/* --- 7. SOCIAL MEDIA REACH --- */}
          <div className="card border-0 rounded-4 p-4" style={{ background: "linear-gradient(to right, #eef2ff, #f5f7fb)" }}>
            <h5 className="fw-bold mb-3 text-dark"><Users size={18} className="me-2 text-primary" /> Social Media Reach</h5>
            {socialMedia.map((social: any) => (
              <div key={social.id} className="card border-0 shadow-sm p-4 d-flex flex-md-row justify-content-between align-items-center rounded-4 mb-3">
                <div className="d-flex align-items-center mb-3 mb-md-0">
                  <div className="p-3 bg-primary rounded-4 text-white me-3"><Users size={24}/></div>
                  <div>
                    <div className="fw-bold fs-5 text-dark">{social.platform}</div>
                    <div className="text-muted">Followers: <b className="text-dark">{social.followers}</b> &nbsp; Reach: <b className="text-dark">{social.engagement_rate}%</b></div>
                  </div>
                </div>
                <div className="text-md-end border-start ps-md-4">
                  <small className="text-muted d-block text-uppercase small fw-bold mb-1">Last Update</small>
                  <div className="fw-bold text-dark">{new Date(social.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            <div className="text-center mt-3">
              <a href="#" className="small fw-bold text-primary text-decoration-none">View Detailed Analytics Dashboard →</a>
            </div>
          </div>

      {/* MODAL */}

      {showModal && (

        <div

          className="modal show d-block"

          tabIndex={-1}

          style={{ background: "rgba(17,24,39,0.8)", backdropFilter: "blur(4px)" }}

        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">

              <div className="modal-header border-0 bg-light p-4">

                <h5 className="fw-bold mb-0">Add New SEO Task</h5>

                <button

                  className="btn-close shadow-none"

                  onClick={() => setShowModal(false)}

                ></button>

              </div>



              <div className="modal-body p-4">

                <div className="mb-3">

                  <label className="form-label fw-bold small text-muted">

                    TASK CATEGORY

                  </label>



                  <select

                    className="form-select border-light bg-light shadow-none rounded-3"

                    value={taskType}

                    onChange={(e) => setTaskType(e.target.value)}

                  >

                    <option value="ON_PAGE">On Page Optimization</option>

                    <option value="KEYWORD">Keyword Research</option>

                    <option value="TECHNICAL">Technical SEO Fix</option>

                    <option value="BACKLINK">Backlink Building</option>

                  </select>

                </div>



                <textarea

                  className="form-control border-light bg-light shadow-none rounded-3"

                  rows={4}

                  placeholder="Describe the steps needed..."

                  value={description}

                  onChange={(e) => setDescription(e.target.value)}

                />

              </div>



              <div className="modal-footer border-0 p-4 pt-0">

                <button

                  className="btn btn-light px-4 rounded-3 fw-bold"

                  onClick={() => setShowModal(false)}

                >

                  Cancel

                </button>



                <button

                  className="btn btn-primary px-4 rounded-3 fw-bold shadow-sm"

                  onClick={createTask}

                >

                  Create Task

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};

export default SEOPage;