import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

type Invoice = {
  id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total: number;
  status: "paid" | "pending" | "cancelled";
};

const ClientInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 5;

  const fetchInvoices = async (page: number) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/invoices/?page=${page}`);
      setInvoices(res.data.results || res.data || []);
      setTotalCount(res.data.count || (res.data.results || res.data || []).length);
    } catch (err) {
      console.error("Error fetching client invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage]);

  const handleDownload = (invoiceId: number) => {
    // Open Django download endpoint directly in a new window/tab
    window.open(`${axiosInstance.defaults.baseURL}/invoices/${invoiceId}/download/`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="badge bg-success-subtle text-success">Paid</span>;
      case "pending":
        return <span className="badge bg-warning-subtle text-warning-emphasis">Pending</span>;
      default:
        return <span className="badge bg-danger-subtle text-danger">{status}</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="mb-4 animate__animated animate__fadeIn">
        <h2 className="fw-bold text-dark mb-1">Invoices & Payments</h2>
        <p className="text-muted mb-0">Track billing statements, payment cycles, outstanding amounts, and invoices download.</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5 animate__animated animate__fadeInUp">
          <i className="bi bi-wallet2 text-muted" style={{ fontSize: "4rem" }}></i>
          <h5 className="mt-3 fw-bold text-dark">No Invoices Found</h5>
          <p className="text-muted">You have no invoices generated under your account.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white animate__animated animate__fadeInUp">
          <div className="table-responsive">
            <table className="table align-middle table-hover">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="fw-bold text-dark">#{inv.invoice_number}</td>
                    <td>{inv.issue_date}</td>
                    <td>{inv.due_date}</td>
                    <td className="fw-bold text-dark">₹{Number(inv.total).toLocaleString("en-IN")}</td>
                    <td>{getStatusBadge(inv.status)}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-outline-primary btn-sm rounded-pill px-3"
                        onClick={() => handleDownload(inv.id)}
                      >
                        <i className="bi bi-download me-1"></i> Download PDF
                      </button>
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

export default ClientInvoicesPage;
