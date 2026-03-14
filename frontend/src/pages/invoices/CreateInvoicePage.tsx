import React, { useState, useEffect } from "react"
import api from "../../api/axiosInstance"
import { useNavigate, useParams } from "react-router-dom"
import { getResults } from "@/utils/apiHelper"
import axiosInstance from "../../api/axiosInstance";
interface Client {
  id:number
  name:string
  address?:string
}

interface Service {
  id:number
  name:string
  price:number
}

interface Item{
  description:string
  quantity:number
  rate:number
}
interface Props {
invoiceId?: number | null
isEdit?: boolean
}
const CreateInvoicePage:React.FC<Props> = ({invoiceId,isEdit}) => {

const { id } = useParams()
const navigate = useNavigate()

const [clients,setClients] = useState<Client[]>([])
const [client,setClient] = useState<number | "">("")
const [clientAddress,setClientAddress] = useState("")

const [services,setServices] = useState<Service[]>([])

const [items,setItems] = useState<Item[]>([
{description:"",quantity:1,rate:0}
])

const [invoiceNumber,setInvoiceNumber] = useState("")
const [project,setProject] = useState("")
const [issueDate,setIssueDate] = useState(
new Date().toISOString().split("T")[0]
)
const [dueDate,setDueDate] = useState("")

const [gst,setGst] = useState(0)
const [notes,setNotes] = useState("")
const [advance,setAdvance] = useState<number | "">("")

const [selectedTemplate,setSelectedTemplate] = useState("")
const [pdfPreview,setPdfPreview] = useState("")

useEffect(()=>{

if(isEdit && invoiceId){

axiosInstance.get(`/invoices/${invoiceId}/`)
.then(res=>{

const data = res.data

setInvoiceNumber(data.invoice_number)

setClient(data.client)

setIssueDate(data.issue_date)

setDueDate(data.due_date)

setGst(data.tax_rate || 0)

setItems(data.items || [])

setNotes(data.notes || "")

setAdvance(data.advance || "")

})

}

},[invoiceId,isEdit])

/* PREDEFINED DESCRIPTION TEMPLATES */

const descriptionTemplates:any={
SEO:"SEO Services for website optimization including keyword research, on-page SEO and reporting",
WEBSITE:"Website design and development services",
HOSTING:"Website hosting and server maintenance",
MARKETING:"Digital marketing and campaign management"
}

/* FETCH INVOICE NUMBER */

const fetchInvoiceNumber = async () => {
try{
const res = await api.get("/invoices/next-number/")
setInvoiceNumber(res.data.invoice_number)
}catch(err){
console.error(err)
}
}

/* FETCH CLIENTS */

const fetchClients = async ()=>{
const res = await api.get("/clients/")
setClients(getResults(res))
}

/* FETCH SERVICES (for autocomplete) */

const fetchServices = async ()=>{
try{
const res = await api.get("/services/")
setServices(getResults(res))
}catch(err){
console.error(err)
}
}

/* CLIENT CHANGE → AUTO ADDRESS */

const handleClientChange = (id:number)=>{

setClient(id)

const selected = clients.find(c=>c.id===id)

if(selected){
setClientAddress(selected.address || "")
}

}

/* ITEM MANAGEMENT */

const addItem = ()=>{
setItems([...items,{description:"",quantity:1,rate:0}])
}

const removeItem = (index:number)=>{
const updated=[...items]
updated.splice(index,1)
setItems(updated)
}

const updateItem = (index:number,field:string,value:any)=>{
const updated=[...items]
updated[index]={...updated[index],[field]:value}
setItems(updated)
}

/* APPLY TEMPLATE */

const applyTemplate = (index:number)=>{

if(!selectedTemplate) return

updateItem(index,"description",descriptionTemplates[selectedTemplate])

}

/* SERVICE AUTOCOMPLETE */

const handleServiceSelect = (index:number,serviceName:string)=>{

const service = services.find(s=>s.name===serviceName)

if(service){

updateItem(index,"description",service.name)
updateItem(index,"rate",service.price)

}

}

/* CALCULATIONS */

const subtotal = items.reduce(
(sum,item)=>sum + item.quantity * item.rate,
0
)

const gstAmount = subtotal * gst / 100

const total = subtotal + gstAmount

const balance = Math.max(
total - (typeof advance === "number" ? advance : 0),
0
)

/* PDF PREVIEW */

const previewInvoice = async ()=>{

try{

const payload = {
client,
items,
subtotal,
tax:gstAmount,
total
}

const res = await api.post(
"/invoices/preview/",
payload,
{ responseType:"blob" }
)

const url = URL.createObjectURL(res.data)

setPdfPreview(url)

}catch(err){

console.error("Preview failed",err)

}

}

/* SAVE INVOICE */

const saveInvoice = async ()=>{

const formattedItems = items.map(item=>({
description:item.description,
quantity:item.quantity,
rate:item.rate
}))

const payload = {
client,
issue_date:issueDate,
due_date:dueDate,
items:formattedItems,
subtotal,
tax:gstAmount,
total,
advance: typeof advance==="number"?advance:0,
notes
}

try{

if(id){

await api.put(`/invoices/${id}/`,payload)

}else{

await api.post("/invoices/",payload)

}

alert("Invoice saved successfully")

navigate("/invoices")

}catch(err){

console.error("Error saving invoice",err)

}

}

useEffect(()=>{
fetchClients()
fetchServices()

if(!id){
fetchInvoiceNumber()
}

},[])

return(

<div className="container-fluid">

<div className="card shadow-sm p-4">

<h4 className="mb-4">
{isEdit ? "Edit Invoice" : "Create Invoice"}
</h4>

{/* TOP FIELDS */}

<div className="row g-3 mb-4">

<div className="col-md-6">
<label>Invoice Number</label>
<input
className="form-control"
value={invoiceNumber}
readOnly
/>
</div>

<div className="col-md-6">
<label>Tax Rate (%)</label>
<input
type="number"
className="form-control"
value={gst}
onChange={(e)=>setGst(Number(e.target.value))}
/>
</div>

<div className="col-md-6">
<label>Client</label>
<select
className="form-control"
value={client}
onChange={(e)=>handleClientChange(Number(e.target.value))}
>
<option>Select Client</option>

{clients.map(c=>(
<option key={c.id} value={c.id}>
{c.name}
</option>
))}

</select>
</div>

<div className="col-md-6">
<label>Project (Optional)</label>
<input
className="form-control"
value={project}
onChange={(e)=>setProject(e.target.value)}
/>
</div>

<div className="col-md-6">
<label>Issue Date</label>
<input
type="date"
className="form-control"
value={issueDate}
onChange={(e)=>setIssueDate(e.target.value)}
/>
</div>

<div className="col-md-6">
<label>Due Date</label>
<input
type="date"
className="form-control"
value={dueDate}
onChange={(e)=>setDueDate(e.target.value)}
/>
</div>

</div>

{/* CLIENT ADDRESS */}

{clientAddress && (

<div className="mb-3">

<label>Client Address</label>

<textarea
className="form-control"
value={clientAddress}
readOnly
/>

</div>

)}

{/* TEMPLATE */}

<div className="mb-3">

<label>Select Description Template</label>

<select
className="form-control w-50"
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

{/* ITEMS TABLE */}

<table className="table table-bordered">

<thead className="table-light">

<tr>
<th>Description</th>
<th style={{ width: "120px" }}>Qty</th>
<th style={{ width: "150px" }}>Rate</th>
<th style={{ width: "150px" }}>Amount</th>
<th style={{ width: "60px" }}></th>
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
list="services"
className="form-control"
value={item.description}
onChange={(e)=>{
updateItem(index,"description",e.target.value)
handleServiceSelect(index,e.target.value)
}}
/>

<datalist id="services">
{services.map(s=>(
<option key={s.id} value={s.name}/>
))}
</datalist>

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

<td>₹{amount}</td>

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

<button
className="btn btn-primary mb-3"
onClick={addItem}
>
Add Item
</button>

{/* NOTES + TOTALS */}

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

{/* BUTTONS */}

<div className="mt-4 d-flex gap-2">

<button
className="btn btn-secondary"
onClick={previewInvoice}
>
Preview PDF
</button>

<button
className="btn btn-success"
onClick={saveInvoice}
>
Save Invoice
</button>

</div>

{/* PDF PREVIEW */}

{pdfPreview && (

<div className="mt-4">

<iframe
src={pdfPreview}
width="100%"
height="600px"
title="Invoice Preview"
/>

</div>

)}

</div>

</div>

)

}

export default CreateInvoicePage