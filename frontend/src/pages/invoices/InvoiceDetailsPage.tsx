import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Layout from "../../components/layout/Layout"
import api from "../../api/axiosInstance"

interface InvoiceItem{
  description:string
  quantity:number
  rate:number
  amount:number
}

interface Payment{
  id:number
  amount:number
  payment_date:string
  payment_mode:string
  notes:string
}

interface Invoice{
  id:number
  invoice_number:string
  client:number
  client_name:string
  issue_date:string
  total:number
  total_paid:number
  balance:number
  status:string
  items:InvoiceItem[]
  payments:Payment[]
}

const InvoiceDetailsPage = ()=>{

const { id } = useParams()
const navigate = useNavigate()

const [invoice,setInvoice] = useState<Invoice | null>(null)

const [showPaymentModal,setShowPaymentModal] = useState(false)

const [paymentAmount,setPaymentAmount] = useState("")
const [paymentMode,setPaymentMode] = useState("cash")
const [paymentNotes,setPaymentNotes] = useState("")

useEffect(()=>{
fetchInvoice()
},[])

const fetchInvoice = async()=>{

try{

const res = await api.get(`/invoices/${id}/`)
setInvoice(res.data)

}catch(error){

console.error("Error loading invoice",error)

}

}

const addPayment = async () => {

try {

await api.post("/invoice-payments/", {

invoice: Number(id),
amount: Number(paymentAmount),
payment_mode: paymentMode,
payment_date: new Date().toISOString().split("T")[0],
notes: paymentNotes

})

setPaymentAmount("")
setPaymentNotes("")
setShowPaymentModal(false)

fetchInvoice()

} catch (error) {

console.error("Error adding payment", error)

}

}

const downloadInvoice = ()=>{

window.open(`http://127.0.0.1:8000/api/v1/invoices/${id}/download/`)

}

const sendInvoice = async()=>{

try{

await api.post(`/invoices/${id}/send-email/`)
alert("Invoice sent to client")

}catch(error){

console.error("Error sending email",error)

}

}

if(!invoice) return <Layout><div className="container mt-4">Loading...</div></Layout>

return(

<Layout>

<div className="container mt-4">

{/* HEADER */}

<div className="d-flex justify-content-between align-items-center mb-3">

<div>

<button
className="btn btn-outline-secondary btn-sm mb-2"
onClick={()=>navigate("/invoices")}
>
← Back to Invoices
</button>

<h3>Invoice {invoice.invoice_number}</h3>

</div>

<div className="d-flex gap-2">

<button
className="btn btn-success"
onClick={()=>setShowPaymentModal(true)}
>
+ Add Payment
</button>

<button
className="btn btn-outline-primary"
onClick={downloadInvoice}
>
Download PDF
</button>

<button
className="btn btn-outline-secondary"
onClick={sendInvoice}
>
Send Email
</button>

</div>

</div>

{/* INFO */}

<div className="card p-3 mb-4">

<p><strong>Client:</strong> {invoice.client_name}</p>

<p><strong>Date:</strong> {invoice.issue_date}</p>

<p><strong>Status:</strong>

<span className={`badge ms-2 bg-${
invoice.status==="paid"
? "success"
: invoice.status==="partial"
? "primary"
: "warning"
}`}>

{invoice.status}

</span>

</p>

</div>

{/* ITEMS */}

<div className="card p-3 mb-4">

<h5>Invoice Items</h5>

<table className="table">

<thead>

<tr>
<th>Description</th>
<th>Qty</th>
<th>Rate</th>
<th>Amount</th>
</tr>

</thead>

<tbody>

{invoice.items.map((item,index)=>(

<tr key={index}>

<td>{item.description}</td>
<td>{item.quantity}</td>
<td>₹{item.rate}</td>
<td>₹{item.amount}</td>

</tr>

))}

</tbody>

</table>

</div>

{/* SUMMARY */}

<div className="card p-3 mb-4">

<h5>Summary</h5>

<p>Total : ₹{invoice.total}</p>

<p>Paid : ₹{invoice.total_paid}</p>

<h5>Balance : ₹{invoice.balance}</h5>

</div>

{/* PAYMENTS */}

<div className="card p-3 mb-4">

<h5>Payments</h5>

<table className="table">

<thead>

<tr>
<th>Date</th>
<th>Amount</th>
<th>Mode</th>
<th>Notes</th>
</tr>

</thead>

<tbody>

{invoice.payments?.length === 0 && (
<tr>
<td colSpan={4} className="text-center">
No payments recorded
</td>
</tr>
)}

{invoice.payments?.map((pay)=>(

<tr key={pay.id}>

<td>{pay.payment_date}</td>
<td>₹{pay.amount}</td>
<td>{pay.payment_mode}</td>
<td>{pay.notes}</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

{/* PAYMENT MODAL */}

{showPaymentModal && (
<>
<div className="modal fade show d-block">
<div className="modal-dialog">
<div className="modal-content">

<div className="modal-header">
<h5>Add Payment</h5>

<button
className="btn-close"
onClick={()=>setShowPaymentModal(false)}
></button>

</div>

<div className="modal-body">

<input
type="number"
className="form-control mb-3"
placeholder="Amount"
value={paymentAmount}
onChange={(e)=>setPaymentAmount(e.target.value)}
/>

<select
className="form-control mb-3"
value={paymentMode}
onChange={(e)=>setPaymentMode(e.target.value)}
>

<option value="cash">Cash</option>
<option value="bank">Bank Transfer</option>
<option value="upi">UPI</option>
<option value="card">Card</option>

</select>

<input
className="form-control"
placeholder="Notes"
value={paymentNotes}
onChange={(e)=>setPaymentNotes(e.target.value)}
/>

</div>

<div className="modal-footer">

<button
className="btn btn-secondary"
onClick={()=>setShowPaymentModal(false)}
>
Cancel
</button>

<button
className="btn btn-success"
onClick={addPayment}
>
Add Payment
</button>

</div>

</div>
</div>
</div>

<div className="modal-backdrop fade show"></div>
</>
)}

</Layout>

)

}

export default InvoiceDetailsPage