import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import Layout from "../../components/layout/Layout";
interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  issue_date: string;
  total_amount: number;
  status: string;
}

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/invoices/");
      setInvoices(res.data);
    } catch (error) {
      console.error("Error fetching invoices", error);
    }
  };

  return (
    <Layout>
    <div className="container mt-4">

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Invoices</h3>

        <Link to="/invoices/create" className="btn btn-primary">
          Create Invoice
        </Link>
      </div>

      <table className="table table-bordered">

        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Client</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.invoice_number}</td>
              <td>{inv.client_name}</td>
              <td>{inv.issue_date}</td>
              <td>₹{inv.total_amount}</td>

              <td>
                <span className={`badge bg-${inv.status === "paid" ? "success" : "warning"}`}>
                  {inv.status}
                </span>
              </td>

              <td>
                <Link
                  to={`/invoices/${inv.id}`}
                  className="btn btn-sm btn-primary"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}

        </tbody>

      </table>
    </div>
    </Layout>
  );
};

export default InvoicesPage;