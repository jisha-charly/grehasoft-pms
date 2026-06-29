import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

type Keyword = {
  id: number;
  website_name: string;
  keyword: string;
  target_url: string;
  search_engine: string;
  initial_rank: number;
  current_rank: number;
  target_rank: number;
  last_updated: string;
};

type Website = {
  id: number;
  website_name: string;
  domain_name: string;
};

const ClientSEOReportsPage: React.FC = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWeb, setSelectedWeb] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 10;

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const res = await axiosInstance.get("/websites/?all=true");
        setWebsites(res.data.results || res.data || []);
      } catch (err) {
        console.error("Error loading websites list:", err);
      }
    };
    fetchWebsites();
  }, []);

  useEffect(() => {
    const fetchKeywords = async () => {
      setLoading(true);
      try {
        let url = `/seo-keywords/?page=${currentPage}`;
        if (selectedWeb) url += `&website=${selectedWeb}`;

        const res = await axiosInstance.get(url);
        setKeywords(res.data.results || res.data || []);
        setTotalCount(res.data.count || (res.data.results || res.data || []).length);
      } catch (err) {
        console.error("Error fetching keyword list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKeywords();
  }, [currentPage, selectedWeb]);

  const getRankMovement = (initial: number, current: number) => {
    const diff = initial - current;
    if (diff > 0) {
      return (
        <span className="text-success fw-bold small">
          <i className="bi bi-arrow-up-circle-fill me-1"></i>+{diff} positions
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="text-danger fw-bold small">
          <i className="bi bi-arrow-down-circle-fill me-1"></i>{diff} positions
        </span>
      );
    }
    return <span className="text-muted small">No change</span>;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="mb-4 animate__animated animate__fadeIn">
        <h2 className="fw-bold text-dark mb-1">SEO & Keyword Rankings</h2>
        <p className="text-muted mb-0">Monitor search positions, keywords targeting, and index optimization details.</p>
      </div>

      {/* Website select list */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white animate__animated animate__fadeInUp">
        <div className="row align-items-center">
          <div className="col-md-4">
            <label className="form-label small text-secondary fw-bold">Select Domain Properties</label>
            <select
              className="form-select rounded-pill btn-sm"
              value={selectedWeb}
              onChange={(e) => { setSelectedWeb(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Domains</option>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.website_name} ({w.domain_name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {websites.length === 0 && !loading ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5 animate__animated animate__fadeInUp bg-white">
          <i className="bi bi-globe-americas text-muted" style={{ fontSize: "4rem" }}></i>
          <h5 className="mt-3 fw-bold text-dark">No Active SEO Campaigns</h5>
          <p className="text-muted">There are no website domains configured for tracking on your account currently.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : keywords.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5 animate__animated animate__fadeInUp bg-white">
          <i className="bi bi-search text-muted" style={{ fontSize: "4rem" }}></i>
          <h5 className="mt-3 fw-bold text-dark">No Keywords Found</h5>
          <p className="text-muted">No keywords are being tracked for this domain currently.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white animate__animated animate__fadeInUp">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Target URL</th>
                  <th>Search Engine</th>
                  <th className="text-center">Initial Rank</th>
                  <th className="text-center">Current Rank</th>
                  <th className="text-center">Target Rank</th>
                  <th>Movement</th>
                  <th>Last Scanned</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw) => (
                  <tr key={kw.id}>
                    <td className="fw-bold text-dark">{kw.keyword}</td>
                    <td>
                      <a href={kw.target_url} target="_blank" rel="noreferrer" className="text-decoration-none small">
                        {kw.target_url ? kw.target_url.substring(0, 30) + "..." : "N/A"}
                      </a>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-google text-primary me-1"></i> {kw.search_engine || "Google"}
                      </span>
                    </td>
                    <td className="text-center fw-medium">{kw.initial_rank || "N/A"}</td>
                    <td className="text-center">
                      <span className={`badge ${kw.current_rank <= 10 ? "bg-success" : kw.current_rank <= 50 ? "bg-warning text-dark" : "bg-secondary"}`}>
                        #{kw.current_rank || "N/A"}
                      </span>
                    </td>
                    <td className="text-center fw-bold">#{kw.target_rank || 1}</td>
                    <td>{getRankMovement(kw.initial_rank, kw.current_rank)}</td>
                    <td className="small text-muted">
                      {kw.last_updated ? new Date(kw.last_updated).toLocaleDateString() : "N/A"}
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

export default ClientSEOReportsPage;
