/**
 * Formats a phone number into international format for WhatsApp.
 * e.g., removes all non-numeric characters, double leading zeros,
 * and defaults to prefixing "91" if exactly 10 digits.
 */
export const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
};

/**
 * Opens WhatsApp Web with a specific phone number and message in a new tab.
 */
export const openWhatsAppMessage = (phone: string, message: string): void => {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
  window.open(url, "_blank");
};

/**
 * Sends a pre-filled professional invoice notification to a client.
 */
export interface SendInvoiceOptions {
  clientName: string;
  invoiceNumber: string;
  projectName?: string | null;
  totalAmount: number;
  dueDate: string;
  phone: string;
  securePdfLink: string;
}

export const sendInvoiceViaWhatsApp = (options: SendInvoiceOptions): void => {
  const { clientName, invoiceNumber, projectName, totalAmount, dueDate, phone, securePdfLink } = options;

  const projectLine = projectName ? `Project: ${projectName}\n` : "";

  const message = `Hello ${clientName},

Please find your invoice from Grehasoft.

Invoice No: ${invoiceNumber}
${projectLine}Amount: ₹${totalAmount}
Due Date: ${dueDate}

You can securely view or download the invoice using the link below:

${securePdfLink}

⚠️ This secure link will expire in 2 days.

Thank you for choosing Grehasoft.

Regards,
Grehasoft Team`;

  openWhatsAppMessage(phone, message);
};
