import React, { useState, useEffect } from "react"
import api from "../../api/axiosInstance"
import { useNavigate, useParams } from "react-router-dom"
import { getResults } from "@/utils/apiHelper"
import axiosInstance from "../../api/axiosInstance";
import { useAlert } from "../../hooks/useAlert";
import { AlertVariant } from "../../types/alert";
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

interface Item {
  id?: number
  description: string
  quantity: number
  rate: number
}
interface Props {
  invoiceId?: number | null
  isEdit?: boolean
  onSuccess?: () => void
}
const CreateInvoicePage:React.FC<Props> = ({invoiceId,isEdit,onSuccess}) => {
const { showAlert } = useAlert();

const { id } = useParams()
const navigate = useNavigate()

const [clients,setClients] = useState<Client[]>([])
const [client,setClient] = useState<number | "">("")
const [clientAddress,setClientAddress] = useState("")
const [clientProjects, setClientProjects] = useState<any[]>([])
const [selectedProject, setSelectedProject] = useState<string>("")


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

const [errors, setErrors] = useState<any>({});
const [itemErrors, setItemErrors] = useState<{ [key: number]: any }>({});

const validateForm = () => {
  let newErrors: any = {};
  let newItemErrors: { [key: number]: any } = {};

  if (!invoiceNumber) newErrors.invoiceNumber = "Invoice Number is required";
  if (!client) newErrors.client = "Please select a client";

  if (!issueDate) {
    newErrors.issueDate = "Issue date is required";
  } else {
    const issue = new Date(issueDate);
    issue.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (issue > today) newErrors.issueDate = "Issue date cannot be in the future";
  }

  if (!dueDate) {
    newErrors.dueDate = "Due date is required";
  } else if (issueDate) {
    if (new Date(dueDate) < new Date(issueDate)) {
      newErrors.dueDate = "Due date cannot be before issue date";
    }
  }

  if (gst !== undefined && gst !== null && gst !== "" as any) {
    if (Number(gst) < 0 || Number(gst) > 100) newErrors.gst = "Tax rate must be between 0 and 100";
  }

  if (items.length === 0) {
    newErrors.items = "At least one invoice item is required";
  } else {
    items.forEach((item, index) => {
      let iErr: any = {};
      if (!item.description || !item.description.trim()) iErr.description = "Item description is required";
      if (item.quantity <= 0) iErr.quantity = "Quantity must be greater than 0";
      if (item.rate <= 0) iErr.rate = "Rate must be greater than 0";
      if (Object.keys(iErr).length > 0) newItemErrors[index] = iErr;
    });
  }

  setErrors(newErrors);
  setItemErrors(newItemErrors);
  return Object.keys(newErrors).length === 0 && Object.keys(newItemErrors).length === 0;
};

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

setProject(data.project || "")

if (data.client) {
  api.get(`/clients/${data.client}/projects/`)
    .then(projRes => {
      setClientProjects(projRes.data || []);
      const matched = projRes.data?.find((p: any) => p.name === data.project);
      if (matched) {
        setSelectedProject(matched.id);
      }
    })
    .catch(err => console.error("Error fetching client projects in edit mode", err));
}

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

/* CLIENT CHANGE → AUTO ADDRESS & LOAD PROJECTS */

const handleClientChange = async (id: number | "") => {
  setClient(id);
  setSelectedProject("");
  setProject("");
  setClientProjects([]);
  setItems([{ description: "", quantity: 1, rate: 0 }]);

  if (id === "") {
    setClientAddress("");
    return;
  }

  const selected = clients.find(c => c.id === id);
  if (selected) {
    setClientAddress(selected.address || "");
  }

  try {
    const res = await api.get(`/clients/${id}/projects/`);
    setClientProjects(res.data || []);
  } catch (err) {
    console.error("Error loading client projects", err);
  }
};

/* PROJECT CHANGE → AUTO-FILL INVOICE ITEMS */

const handleProjectChange = (projId: string) => {
  setSelectedProject(projId);

  if (projId === "") {
    return;
  }

  const selectedProj = clientProjects.find(p => p.id === projId);
  if (selectedProj) {
    const targetDesc = selectedProj.description || selectedProj.name;

    // Check if duplicate item (already has this description)
    const isDuplicate = items.some(item => item.description === targetDesc);
    if (isDuplicate) {
      showAlert({
        variant: AlertVariant.WARNING,
        message: "This project has already been added."
      });
      setSelectedProject(""); // Reset dropdown
      return;
    }

    const newItem = {
      description: targetDesc,
      quantity: 1,
      rate: selectedProj.rate || 0
    };

    // Replace if there is only one blank item placeholder. Otherwise, append.
    if (items.length === 1 && items[0].description === "" && items[0].rate === 0) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }
  }

  // Reset dropdown back to "Select Project"
  setSelectedProject("");
};

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

if (itemErrors[index] && itemErrors[index][field]) {
  const newIErrs = { ...itemErrors };
  newIErrs[index] = { ...newIErrs[index] };
  delete newIErrs[index][field];
  setItemErrors(newIErrs);
}
if (errors.items) {
  setErrors({ ...errors, items: null });
}
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

const saveInvoice = async (e?: React.FormEvent)=>{
if (e) e.preventDefault();
if (!validateForm()) return;

const formattedItems = items.map((item: any)=>({
id: item.id,
description:item.description,
quantity:item.quantity,
rate:item.rate
}))

const payload = {
invoice_number: invoiceNumber,
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

const isEditing = isEdit || !!id;
const targetId = invoiceId || id;

try{

if(isEditing && targetId){

await api.put(`/invoices/${targetId}/`,payload)

}else{

await api.post("/invoices/",payload)

}

await showAlert({
  variant: AlertVariant.SUCCESS,
  message: isEditing ? "Invoice updated successfully." : "Invoice saved successfully"
});

if (onSuccess) {
  onSuccess();
} else {
  navigate("/invoices")
}

}catch(err: any){

console.error("Error saving invoice",err)
if (err.response?.data) {
  const data = err.response.data;
  let newErrors: any = {};
  if (data.invoice_number) newErrors.invoiceNumber = data.invoice_number[0];
  if (data.due_date) newErrors.dueDate = data.due_date[0];
  if (data.issue_date) newErrors.issueDate = data.issue_date[0];
  if (data.client) newErrors.client = data.client[0];
  if (data.items && typeof data.items[0] === 'string') newErrors.items = data.items[0];
  setErrors(newErrors);
}

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

<form onSubmit={saveInvoice} noValidate>
<div className="row g-3 mb-4">

<div className="col-md-6">
<label>Invoice Number *</label>
<input
name="invoiceNumber"
className={`form-control ${errors.invoiceNumber ? 'is-invalid' : ''}`}
value={invoiceNumber}
onChange={(e) => {
  setInvoiceNumber(e.target.value);
  if (errors.invoiceNumber) setErrors({...errors, invoiceNumber: null});
}}
/>
{errors.invoiceNumber && <div className="invalid-feedback">{errors.invoiceNumber}</div>}
</div>

<div className="col-md-6">
<label>Tax Rate (%)</label>
<input
type="number"
name="gst"
className={`form-control ${errors.gst ? 'is-invalid' : ''}`}
value={gst}
onChange={(e)=>{
  setGst(Number(e.target.value));
  if (errors.gst) setErrors({...errors, gst: null});
}}
/>
{errors.gst && <div className="invalid-feedback">{errors.gst}</div>}
</div>

<div className="col-md-6">
<label>Client *</label>
<select
name="client"
className={`form-select ${errors.client ? 'is-invalid' : ''}`}
value={client}
onChange={(e)=>{
  handleClientChange(Number(e.target.value));
  if (errors.client) setErrors({...errors, client: null});
}}
>
<option value="">Select Client</option>

{clients.map(c=>(
<option key={c.id} value={c.id}>
{c.name}
</option>
))}

</select>
{errors.client && <div className="invalid-feedback">{errors.client}</div>}
</div>

<div className="col-md-6">
<label>Project (Auto-fill Invoice Items)</label>
<select
name="project"
className="form-select"
value={selectedProject}
onChange={(e)=>{
  handleProjectChange(e.target.value);
}}
disabled={!client}
>
<option value="">Select Project</option>
{clientProjects.map(p=>(
<option key={p.id} value={p.id}>
{p.name}
</option>
))}
</select>
</div>

<div className="col-md-6">
<label>Issue Date *</label>
<input
type="date"
name="issueDate"
className={`form-control ${errors.issueDate ? 'is-invalid' : ''}`}
value={issueDate}
onChange={(e)=>{
  setIssueDate(e.target.value);
  if (errors.issueDate) setErrors({...errors, issueDate: null});
}}
/>
{errors.issueDate && <div className="invalid-feedback">{errors.issueDate}</div>}
</div>

<div className="col-md-6">
<label>Due Date *</label>
<input
type="date"
name="dueDate"
className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`}
value={dueDate}
onChange={(e)=>{
  setDueDate(e.target.value);
  if (errors.dueDate) setErrors({...errors, dueDate: null});
}}
/>
{errors.dueDate && <div className="invalid-feedback">{errors.dueDate}</div>}
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

<div className="flex-grow-1">
<input
list="services"
className={`form-control ${itemErrors[index]?.description ? 'is-invalid' : ''}`}
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
{itemErrors[index]?.description && <div className="invalid-feedback">{itemErrors[index].description}</div>}
</div>

<button
type="button"
className="btn btn-sm btn-secondary h-100"
onClick={()=>applyTemplate(index)}
>
Use
</button>

</div>

</td>

<td>

<input
type="number"
className={`form-control ${itemErrors[index]?.quantity ? 'is-invalid' : ''}`}
value={item.quantity}
onChange={(e)=>updateItem(index,"quantity",Number(e.target.value))}
/>
{itemErrors[index]?.quantity && <div className="invalid-feedback">{itemErrors[index].quantity}</div>}

</td>

<td>

<input
type="number"
className={`form-control ${itemErrors[index]?.rate ? 'is-invalid' : ''}`}
value={item.rate}
onChange={(e)=>updateItem(index,"rate",Number(e.target.value))}
/>
{itemErrors[index]?.rate && <div className="invalid-feedback">{itemErrors[index].rate}</div>}

</td>

<td>₹{amount}</td>

<td>

<button
type="button"
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

{errors.items && <div className="text-danger small mb-2 fw-bold">{errors.items}</div>}

<button
type="button"
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
type="button"
className="btn btn-secondary"
onClick={previewInvoice}
>
Preview PDF
</button>

<button
type="submit"
className="btn btn-success"
>
{isEdit ? "Update Invoice" : "Create Invoice"}
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

</form>

</div>

</div>

)

}

export default CreateInvoicePage