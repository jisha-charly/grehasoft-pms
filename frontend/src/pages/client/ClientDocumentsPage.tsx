import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { FileText, Download, Eye, Folder, Filter, Calendar } from "lucide-react";

type Document = {
  id: string;
  name: string;
  type: string;
  project_name: string;
  date: string;
  url: string;
  download_url: string | null;
  file_size?: string;
};

const ClientDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 10;

  // Filter states
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchDocuments = async (page: number) => {
    setLoading(true);
    try {
      let url = `/dashboard/documents/?page=${page}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedType) url += `&type=${selectedType}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const res = await axiosInstance.get(url);
      setDocuments(res.data.results || res.data || []);
      setTotalCount(res.data.count || (res.data.results || res.data || []).length);
    } catch (err) {
      console.error("Error fetching client documents list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 on filter changes
    setCurrentPage(1);
  }, [search, selectedType, startDate, endDate]);

  useEffect(() => {
    fetchDocuments(currentPage);
  }, [currentPage, search, selectedType, startDate, endDate]);

  const handleDownload = async (doc: Document) => {
    if (!doc.download_url) return;
    
    try {
      const token = localStorage.getItem("access");
      const suffix = token ? `?token=${token}` : "";
      window.open(`${axiosInstance.defaults.baseURL}${doc.download_url.replace("/api/v1", "")}${suffix}`, "_blank");
    } catch (err) {
      console.error("Download failed:", err);
      alert("Error initiating file download.");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedType("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="mb-4 animate__animated animate__fadeIn">
        <h2 className="fw-bold text-dark mb-1">Centralized Vault</h2>
        <p className="text-muted mb-0">Access proposals, invoices, deliverables, and SEO daily work proofs in one hub.</p>
      </div>

      {/* Advanced Filters */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white animate__animated animate__fadeInUp">
        <h6 className="fw-bold text-dark mb-3">Search Vault</h6>
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label small text-secondary fw-bold">Search Keyword</label>
            <input
              type="text"
              className="form-control rounded-pill btn-sm"
              placeholder="Search by keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small text-secondary fw-bold">Document Type</label>
            <select
              className="form-select rounded-pill btn-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="proposal">Proposals</option>
              <option value="invoice">Invoices</option>
              <option value="taskfile">Task Deliverables</option>
              <option value="seo_report">SEO Campaign Reports</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label small text-secondary fw-bold">Start Date</label>
            <input
              type="date"
              className="form-control rounded-pill btn-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small text-secondary fw-bold">End Date</label>
            <input
              type="date"
              className="form-control rounded-pill btn-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {(search || selectedType || startDate || endDate) && (
          <div className="mt-3 text-end">
            <button className="btn btn-outline-secondary rounded-pill btn-sm" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5 bg-white animate__animated animate__fadeInUp">
          <Folder className="mx-auto text-muted opacity-20 mb-3" size={64} />
          <h5 className="fw-bold text-dark">No Documents Found</h5>
          <p className="text-muted">You do not have any proposals, invoices, or files uploaded to your account.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white animate__animated animate__fadeInUp">
          <div className="table-responsive">
            <table className="table align-middle table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Associated Service</th>
                  <th>Date</th>
                  <th>File Size</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <FileText className="text-secondary me-2" size={18} />
                        <span className="fw-bold text-dark">{doc.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge rounded-pill px-3 py-1 fw-semibold ${
                        doc.type === "Proposal" ? "bg-primary-subtle text-primary" : 
                        doc.type === "Invoice" ? "bg-success-subtle text-success" : 
                        doc.type === "SEO Report" ? "bg-info-subtle text-info" :
                        "bg-warning-subtle text-warning-emphasis"
                      }`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="small text-muted">{doc.project_name}</td>
                    <td className="small">{doc.date || "N/A"}</td>
                    <td className="small fw-semibold text-secondary">{doc.file_size || "N/A"}</td>
                    <td className="text-end">
                      {doc.type === "Proposal" ? (
                        <Link
                          to={doc.url}
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                        >
                          <Eye size={14} className="me-1" /> View Proposal
                        </Link>
                      ) : doc.download_url ? (
                        <button
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download size={14} className="me-1" /> Download
                        </button>
                      ) : (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                        >
                          <Eye size={14} className="me-1" /> View File
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <button
                className="btn btn-outline-primary rounded-pill btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>
              <span className="small text-secondary fw-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline-primary rounded-pill btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientDocumentsPage;
