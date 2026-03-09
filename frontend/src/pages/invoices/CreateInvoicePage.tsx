import React, { useState, useEffect } from "react"
import Layout from "../../components/layout/Layout"
import api from "../../api/axiosInstance"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom"
interface Client{
  id:number
  name:string
}

interface Item{
  description:string
  quantity:number
  rate:number
}

const CreateInvoicePage = ()=>{
const { id } = useParams()
const navigate = useNavigate()

const [clients,setClients] = useState<Client[]>([])
const [client,setClient] = useState<number | "">("")

const [items,setItems] = useState<Item[]>([
{description:"",quantity:1,rate:0}
])

const [gst,setGst] = useState(0)
const [notes,setNotes] = useState("")
const [advance,setAdvance] = useState<number | "">("")
const [invoiceNumber,setInvoiceNumber] = useState("")

/* PREDEFINED DESCRIPTIONS */

const descriptionTemplates:any={
SEO:"SEO Services for website optimization including keyword research, on-page SEO and reporting",
WEBSITE:"Website design and development services",
HOSTING:"Website hosting and server maintenance",
MARKETING:"Digital marketing and campaign management"
}
const fetchInvoiceNumber = async () => {
  try {
    const res = await api.get("/invoices/next-number/");
    setInvoiceNumber(res.data.invoice_number);
  } catch (error) {
    console.error("Error fetching invoice number", error);
  }
};
const [selectedTemplate,setSelectedTemplate] = useState("")

const fetchInvoice = async () => {

try {

const res = await api.get(`/invoices/${id}/`)

const data = res.data

setInvoiceNumber(data.invoice_number)

setClient(data.client)

setItems(
  data.items.map((item:any)=>({
    description:item.description,
    quantity:item.quantity,
    rate:item.rate
  }))
)

setNotes(data.notes)

}catch(error){

console.error("Error loading invoice", error)

}

}

useEffect(() => {

fetchClients()

if (id) {
  fetchInvoice()
} else {
  fetchInvoiceNumber()
}

}, [id])

const fetchClients = async()=>{
const res = await api.get("/clients/")
setClients(res.data)
}

const addItem=()=>{
setItems([...items,{description:"",quantity:1,rate:0}])
}

const removeItem=(index:number)=>{
const updated=[...items]
updated.splice(index,1)
setItems(updated)
}

const updateItem=(index:number,field:string,value:any)=>{

const updated=[...items]
updated[index]={...updated[index],[field]:value}
setItems(updated)

}

/* APPLY TEMPLATE */

const applyTemplate=(index:number)=>{

if(!selectedTemplate) return

updateItem(index,"description",descriptionTemplates[selectedTemplate])

}

/* CALCULATIONS */

const subtotal = items.reduce(
(sum,item)=>sum + item.quantity * item.rate,
0
)

const gstAmount = subtotal * gst / 100

const total = subtotal + gstAmount

const balance = total - (typeof advance === "number" ? advance : 0)

/* SAVE INVOICE */

const saveInvoice = async () => {

const formattedItems = items.map(item => ({
description:item.description,
quantity:item.quantity,
rate:item.rate
}))

const payload = {
  client: client,
  due_date: new Date().toISOString().split("T")[0],
  items: formattedItems,
  subtotal: subtotal,
  tax: gstAmount,
  total: total,
  advance: typeof advance === "number" ? advance : 0,
  notes: notes
}

try {

let res

if(id){
res = await api.put(`/invoices/${id}/`, payload)
}else{
res = await api.post("/invoices/", payload)
}

alert("Invoice saved successfully")

navigate("/invoices")

}catch(error){

console.error("Error saving invoice", error)

}

}

return(

<Layout>

<div className="container-fluid">

<div className="card shadow-sm p-4">

<h3>{id ? "Edit Invoice" : "Create Invoice"}</h3>

<div className="row mb-3">

<div className="col-md-6">
 <label className="form-label">Invoice Number</label>

<input
  className="form-control mb-3"
  value={invoiceNumber}
  placeholder="Loading..."
  readOnly
/>

<label className="form-label">Client</label>

<select
className="form-control"
value={client}
onChange={(e)=>setClient(Number(e.target.value))}
>

<option>Select Client</option>

{clients.map(c=>(

<option key={c.id} value={c.id}>
{c.name}
</option>

))}

</select>

</div>

</div>

{/* DESCRIPTION TEMPLATE */}

<div className="row mb-3">

<div className="col-md-4">

<label>Select Description Template</label>

<select
className="form-control"
value={selectedTemplate}
onChange={(e)=>setSelectedTemplate(e.target.value)}
>

<option value="">Select Template</option>

<option value="SEO">SEO</option>
<option value="WEBSITE">Website</option>
<option value="HOSTING">Hosting</option>
<option value="MARKETING">Marketing</option>

</select>

</div>

</div>

<table className="table table-bordered">

<thead className="table-light">

<tr>

<th>Description</th>
<th style={{width:"120px"}}>Qty</th>
<th style={{width:"150px"}}>Rate</th>
<th style={{width:"150px"}}>Amount</th>
<th style={{width:"60px"}}></th>

</tr>

</thead>

<tbody>

{items.map((item,index)=>{

const amount=item.quantity * item.rate

return(

<tr key={index}>

<td>

<div className="d-flex gap-2">

<input
className="form-control"
value={item.description}
onChange={(e)=>updateItem(index,"description",e.target.value)}
/>

<button
className="btn btn-sm btn-secondary"
onClick={()=>applyTemplate(index)}
>
Use
</button>

</div>

</td>

<td>

<input
type="number"
className="form-control"
value={item.quantity}
onChange={(e)=>updateItem(index,"quantity",Number(e.target.value))}
/>

</td>

<td>

<input
type="number"
className="form-control"
value={item.rate}
onChange={(e)=>updateItem(index,"rate",Number(e.target.value))}
/>

</td>

<td>

₹{amount}

</td>

<td>

<button
className="btn btn-sm btn-danger"
onClick={()=>removeItem(index)}
>
×
</button>

</td>

</tr>

)

})}

</tbody>

</table>

<button className="btn btn-primary mb-3" onClick={addItem}>
Add Item
</button>

<div className="row">

<div className="col-md-6">

<textarea
className="form-control"
placeholder="Notes"
value={notes}
onChange={(e)=>setNotes(e.target.value)}
/>

</div>

<div className="col-md-6">

<div className="card p-3">

<p>Subtotal : ₹{subtotal}</p>

<input
type="number"
className="form-control mb-2"
placeholder="GST %"
value={gst}
onChange={(e)=>setGst(Number(e.target.value))}
/>

<p>GST : ₹{gstAmount.toFixed(2)}</p>

<hr/>

<input
type="number"
className="form-control mb-2"
placeholder="Advance Received"
value={advance}
onChange={(e)=>setAdvance(Number(e.target.value))}
/>

<p>Total : ₹{total.toFixed(2)}</p>

<h5>Balance Due : ₹{balance.toFixed(2)}</h5>

</div>

</div>

</div>

<div className="mt-4 d-flex gap-2">

<button
className="btn btn-success"
onClick={saveInvoice}
>
Save Invoice
</button>

</div>

</div>

</div>

</Layout>

)

}

export default CreateInvoicePage