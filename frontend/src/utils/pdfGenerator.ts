import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Proposal } from '../types';
import axiosInstance from '../api/axiosInstance';

export const generateProposalPDF = async (proposal: Proposal) => {
  try {
    const response = await axiosInstance.get(`/proposals/${proposal.id}/download_pdf/`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Proposal_${proposal.title.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading proposal PDF:', error);
    alert('Failed to download proposal PDF. Please try again.');
  }
};

export const downloadInvoicePDF = async (invoiceId: number, invoiceNumber: string) => {
  try {
    const response = await axiosInstance.get(`/invoices/${invoiceId}/download/`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    alert('Failed to download invoice PDF. Please try again.');
  }
};

