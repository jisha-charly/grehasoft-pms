import React, { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import Layout from "../../components/layout/Layout";
import axiosInstance from "../../api/axiosInstance";
import CreateInvoicePage from "./CreateInvoicePage";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
interface Invoice {
  client_name: ReactNode;
  id: number;
  invoice_number: string;
  client: {
    id: number;
    client_name: string
  };
  issue_date: string;
  total: number;
  total_paid: number;
  balance: number;
  status: string;
}

const InvoicesPage = () => {

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
const [showEditModal, setShowEditModal] = useState(false);
const [editInvoiceId, setEditInvoiceId] = useState<number | null>(null);
  

  useEffect(() => {
  fetchInvoices();
}, [page, search]);

  const fetchInvoices = async () => {
  try {
    const res = await axiosInstance.get(`/invoices/?page=${page}&search=${search}`);

    setInvoices(res.data.results); // paginated results
    setTotalPages(Math.ceil(res.data.count / 5)); // total pages

  } catch (error) {
    console.error("Error fetching invoices", error);
  }
};
 const [analytics,setAnalytics] = useState({
total_invoices:0,
total_revenue:0,
total_paid:0,
total_balance:0
})

const fetchAnalytics = async ()=>{
const res = await api.get("/invoices/analytics/")
setAnalytics(res.data)
}

useEffect(()=>{
fetchInvoices()
fetchAnalytics()
},[])
  const confirmDeleteInvoice = async () => {

if (!invoiceToDelete) return;

try {

await api.delete(`/invoices/${invoiceToDelete}/`);

fetchInvoices();

} catch (error) {

console.error("Error deleting invoice", error);

}

};

  const getStatusColor = (status: string) => {

    if (status === "paid") return "success";
    if (status === "partial") return "primary";

    return "warning";

  };
const downloadInvoice = (id:number)=>{
 window.open(`http://127.0.0.1:8000/api/v1/invoices/${id}/download/`)
}

const sendInvoice = async(id:number)=>{
  await api.post(`/invoices/${id}/send-email/`)
  alert("Invoice sent")
}
const pageNumbers: number[] = Array.from(
  { length: totalPages },
  (_, i) => i + 1
);
  return (
<>
   {showModal && (
  <>
    <div className="modal fade show d-block">
     <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">Create New Invoice</h5>
            <button
              className="btn-close"
              onClick={() => setShowModal(false)}
            ></button>
          </div>

          <div className="modal-body">
            <CreateInvoicePage />
          </div>

        </div>
      </div>
    </div>

    <div className="modal-backdrop fade show"></div>
  </>
)}
{showEditModal && (
<>
<div className="modal fade show d-block">
<div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
<div className="modal-content">

<div className="modal-header">

<button
className="btn-close"
onClick={() => setShowEditModal(false)}
></button>
</div>

<div className="modal-body">

<CreateInvoicePage
invoiceId={editInvoiceId}
isEdit={true}
/>

</div>

</div>
</div>
</div>

<div className="modal-backdrop fade show"></div>
</>
)}
    <Layout>
  <div className="row mb-4">

<div className="col-md-3">
<div className="card shadow-sm p-3 text-center">
<h6>Total Invoices</h6>
<h4>{analytics.total_invoices}</h4>
</div>
</div>

<div className="col-md-3">
<div className="card shadow-sm p-3 text-center">
<h6>Total Revenue</h6>
<h4>₹{analytics.total_revenue}</h4>
</div>
</div>

<div className="col-md-3">
<div className="card shadow-sm p-3 text-center">
<h6>Paid Amount</h6>
<h4 className="text-success">₹{analytics.total_paid}</h4>
</div>
</div>

<div className="col-md-3">
<div className="card shadow-sm p-3 text-center">
<h6>Pending Amount</h6>
<h4 className="text-danger">₹{analytics.total_balance}</h4>
</div>
</div>

</div>
      <div className="container mt-4">

        <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex justify-content-between mb-3">
 <input
  type="text"
  className="form-control"
  style={{ width: "250px" }}
  placeholder="Search invoice..."
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setPage(1);
  }}
/>
</div>

          <h3>Invoices</h3>
<button
  className="btn btn-primary"
  onClick={() => setShowModal(true)}
>
  Create Invoice
</button>

        </div>

        <table className="table table-bordered">

          <thead>

            <tr>

              <th>Invoice No</th>
              <th>Client</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            {invoices.length === 0 && (

              <tr>
                <td colSpan={8} className="text-center">
                  No invoices found
                </td>
              </tr>

            )}

            {invoices.map((inv) => (

              <tr key={inv.id}>

                <td>{inv.invoice_number}</td>

              <td>{inv.client_name}</td>

                <td>{inv.issue_date}</td>

                <td>₹{inv.total}</td>

                <td>₹{inv.total_paid}</td>

                <td>₹{inv.balance}</td>

                <td>

                  <span className={`badge bg-${getStatusColor(inv.status)}`}>
                    {inv.status}
                  </span>

                </td>

              <td className="d-flex gap-2">

<Link
to={`/invoices/${inv.id}`}
className="btn btn-sm btn-light"
title="View"
>
<i className="bi bi-eye"></i>
</Link>

{inv.status !== "paid" && (
<>
<button
className="btn btn-sm btn-light"
title="Edit"
onClick={()=>{
setEditInvoiceId(inv.id)
setShowEditModal(true)
}}
>
<i className="bi bi-pencil"></i>
</button>
<button
className="btn btn-sm btn-light text-danger"
onClick={() => {
  setInvoiceToDelete(inv.id);
  setShowDeleteModal(true);
}}
title="Delete"
>
<i className="bi bi-trash"></i>
</button>
</>
)}
{/*
<button
className="btn btn-sm btn-light"
onClick={()=>downloadInvoice(inv.id)}
title="Download Invoice"
>
<i className="bi bi-file-earmark-pdf"></i>
</button>

<button
className="btn btn-sm btn-light"
onClick={()=>sendInvoice(inv.id)}
title="Send Email"
>
<i className="bi bi-envelope"></i>
</button>
*/}
</td>


              </tr>

            ))}

          </tbody>

        </table>
<div className="d-flex justify-content-end align-items-center gap-1 p-3">

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => setPage(1)}
  >
    « First
  </button>

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => setPage(page - 1)}
  >
    ‹ Prev
  </button>

  {pageNumbers.map(num => (
    <button
      key={num}
      className={`btn btn-sm ${page === num ? "btn-primary" : "btn-outline-primary"}`}
      onClick={() => setPage(num)}
    >
      {num}
    </button>
  ))}

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === totalPages}
    onClick={() => setPage(page + 1)}
  >
    Next ›
  </button>

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === totalPages}
    onClick={() => setPage(totalPages)}
  >
    Last »
  </button>

</div>

      </div>
<DeleteConfirmModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={confirmDeleteInvoice}
  title="Delete Invoice"
  message="Are you sure you want to delete this invoice?"
  confirmText="Delete"
/>
    </Layout>
     </>
  );
};

export default InvoicesPage;