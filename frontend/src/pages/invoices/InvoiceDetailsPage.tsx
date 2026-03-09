import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
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
  client:{
    id:number
    name:string
  }
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

const [invoice,setInvoice] = useState<Invoice | null>(null)

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

fetchInvoice()

} catch (error) {

console.error("Error adding payment", error)

}

}

if(!invoice) return <Layout><div className="container mt-4">Loading...</div></Layout>

return(

<Layout>

<div className="container mt-4">

<h3>Invoice {invoice.invoice_number}</h3>

<div className="card p-3 mb-4">

<p><strong>Client:</strong> {invoice.client?.name}</p>

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

{/* TOTALS */}

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

{/* ADD PAYMENT */}

<div className="card p-3">

<h5>Add Payment</h5>

<div className="row">

<div className="col-md-3">

<input
type="number"
className="form-control"
placeholder="Amount"
value={paymentAmount}
onChange={(e)=>setPaymentAmount(e.target.value)}
/>

</div>

<div className="col-md-3">

<select
className="form-control"
value={paymentMode}
onChange={(e)=>setPaymentMode(e.target.value)}
>

<option value="cash">Cash</option>
<option value="bank">Bank Transfer</option>
<option value="upi">UPI</option>
<option value="card">Card</option>

</select>

</div>

<div className="col-md-4">

<input
className="form-control"
placeholder="Notes"
value={paymentNotes}
onChange={(e)=>setPaymentNotes(e.target.value)}
/>

</div>

<div className="col-md-2">

<button
className="btn btn-success w-100"
onClick={addPayment}
>
Add Payment
</button>

</div>

</div>

</div>

</div>

</Layout>

)

}

export default InvoiceDetailsPage