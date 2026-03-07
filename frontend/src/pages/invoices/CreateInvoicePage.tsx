import React, { useState, useEffect, useRef } from "react"
import Layout from "../../components/layout/Layout"
import api from "../../api/axiosInstance"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface Client {
  id:number
  name:string
}

interface Item {
  description:string
  quantity:number
  rate:number
}

const CreateInvoicePage = () => {

  const [clients,setClients] = useState<Client[]>([])
  const [client,setClient] = useState("")

  const [invoiceNumber,setInvoiceNumber] = useState("GSI/2026/001")

  const [items,setItems] = useState<Item[]>([
    {description:"",quantity:1,rate:0}
  ])

  const [gst,setGst] = useState(0)
  const [notes,setNotes] = useState("")

  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{

    fetchClients()
    generateInvoiceNumber()

  },[])

  const fetchClients = async()=>{

    const res = await api.get("/clients/")
    setClients(res.data)

  }

  const generateInvoiceNumber = async()=>{

    try{

      const res = await api.get("/invoices/")
      const count = res.data.length + 1

      const year = new Date().getFullYear()

      const number = `GSI/${year}/${String(count).padStart(3,"0")}`

      setInvoiceNumber(number)

    }catch{

      setInvoiceNumber("GSI/2026/001")

    }

  }

  const addItem = ()=>{

    setItems([...items,{description:"",quantity:1,rate:0}])

  }

  const removeItem=(index:number)=>{

    const updated=[...items]

    updated.splice(index,1)

    setItems(updated)

  }

  const updateItem=(index:number,field:string,value:any)=>{

    const updated=[...items]

    updated[index]={...updated[index],[field]:value} as Item

    setItems(updated)

  }

  const subtotal = items.reduce(
    (sum,item)=>sum + item.quantity * item.rate,
    0
  )

  const gstAmount = subtotal * gst / 100

  const total = subtotal + gstAmount
const saveInvoice = async () => {

  const formattedItems = items.map(item => ({
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.quantity * item.rate
  }))

  const payload = {

    client: client,
   
    due_date: new Date().toISOString().split("T")[0],

    items: formattedItems,

    subtotal: subtotal,
    tax: gstAmount,
    total: total,

    notes: notes

  }

  await api.post("/invoices/", payload)

  alert("Invoice saved successfully")

}

  const downloadPDF = async()=>{

    if(!previewRef.current) return

    const canvas = await html2canvas(previewRef.current)

    const imgData = canvas.toDataURL("image/png")

    const pdf = new jsPDF()

    pdf.addImage(imgData,"PNG",10,10,190,0)

    pdf.save(`${invoiceNumber}.pdf`)

  }

  return (

  <Layout>

  <div className="container-fluid">

  <div className="card shadow-sm p-4">

  <h3 className="mb-4">Create Invoice</h3>

  <div className="row mb-3">

  <div className="col-md-6">

  <label className="form-label">Invoice Number</label>

  <input
  className="form-control"
  value={invoiceNumber}
  readOnly
  />

  </div>

  <div className="col-md-6">

  <label className="form-label">Client</label>

  <select
  className="form-control"
  value={client}
  onChange={(e)=>setClient(e.target.value)}
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

  <input
  className="form-control"
  value={item.description}
  onChange={(e)=>updateItem(index,"description",e.target.value)}
  />

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

  <h5>Total : ₹{total.toFixed(2)}</h5>

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

  <button
  className="btn btn-secondary"
  onClick={downloadPDF}
  >

  Download PDF

  </button>

  </div>

  </div>

  </div>

  {/* Invoice Preview */}

  <div style={{display:"none"}}>

  <div ref={previewRef}>

  <h2>Invoice {invoiceNumber}</h2>

  <p>Client : {client}</p>

  <table className="table">

  <thead>

  <tr>
  <th>Description</th>
  <th>Qty</th>
  <th>Rate</th>
  <th>Total</th>
  </tr>

  </thead>

  <tbody>

  {items.map((item,index)=>{

  const amount=item.quantity * item.rate

  return(

  <tr key={index}>

  <td>{item.description}</td>

  <td>{item.quantity}</td>

  <td>{item.rate}</td>

  <td>{amount}</td>

  </tr>

  )

  })}

  </tbody>

  </table>

  <p>Subtotal : ₹{subtotal}</p>

  <p>GST : ₹{gstAmount}</p>

  <h3>Total : ₹{total}</h3>

  </div>

  </div>

  </Layout>

  )

}

export default CreateInvoicePage