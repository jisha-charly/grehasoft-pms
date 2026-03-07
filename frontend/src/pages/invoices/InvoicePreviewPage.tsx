import React from "react";

const InvoicePreviewPage = () => {

  const invoice = {
    invoice_number: "GSI/2526/160",
    client_name: "Dr. Harikumar",
    issue_date: "07-03-2026",
    items: [
      { description: "Website SEO + Social Media", amount: 13000 },
      { description: "SEO (DLC)", amount: 12000 },
      { description: "Google Map SEO", amount: 5000 },
    ],
  };

  const total = invoice.items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="container mt-4">

      <div className="card p-5" id="invoice">

        <h2 className="text-center">INVOICE</h2>

        <div className="mt-4">

          <strong>Invoice No:</strong> {invoice.invoice_number}
          <br />

          <strong>Date:</strong> {invoice.issue_date}

        </div>

        <div className="mt-3">
          <strong>To:</strong>
          <br />

          {invoice.client_name}
        </div>

        <table className="table mt-4">

          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>

            {invoice.items.map((item, i) => (

              <tr key={i}>
                <td>{item.description}</td>
                <td>₹{item.amount}</td>
              </tr>

            ))}

            <tr>
              <td>
                <strong>Total</strong>
              </td>

              <td>
                <strong>₹{total}</strong>
              </td>
            </tr>

          </tbody>

        </table>

        <div className="mt-4">

          <strong>Bank Details</strong>

          <p>
            Account Name: GREHASOFT
            <br />
            Bank: SBI
            <br />
            IFSC: SBIN0018060
          </p>

        </div>

      </div>

    </div>
  );
};

export default InvoicePreviewPage;