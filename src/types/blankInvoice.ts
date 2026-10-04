import { InvoiceData } from './invoice';

export const BLANK_INVOICE: InvoiceData = {
  id: `inv-${Date.now()}`,
  templateId: 'travel-classic',
  title: 'INVOICE',
  invoiceNumber: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  company: {
    name: 'Your Company Name',
    tagline: 'Your Business Subtitle',
    logoUrl: '',
    address: 'Street Address, City, State, ZIP',
    phone: '+1 234 567 8900',
    email: 'contact@example.com',
    gstin: '',
    website: ''
  },
  client: {
    label: 'Bill to:',
    name: 'Client / Company Name',
    address: 'Client Address Line 1\nCity, State, ZIP Code',
    phone: '',
    email: '',
    taxId: ''
  },
  currency: {
    code: 'INR',
    symbol: '₹',
    position: 'prefix',
    suffixText: '/-'
  },
  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'Bank Name',
      accountNumber: '12345678901234',
      ifscCode: 'BANK0001234',
      accountName: 'Your Account Name',
      accountType: 'Current',
      branch: 'Main Branch',
      pinCode: 'City - 000000'
    }
  ],
  tableHeaders: {
    sno: 'S.no',
    description: 'Item / Service Details',
    qty: 'Qty',
    price: 'Price',
    total: 'Total'
  },
  items: [
    {
      id: 'item-1',
      sno: 1,
      title: 'Item Title',
      description: 'Detailed description of the service or goods provided.',
      qty: 1,
      price: 1000,
      total: 1000
    }
  ],
  dutyHours: 'Timing: 09:00 am to 06:00 pm',
  subtotal: 1000,
  taxPercent: 0,
  taxAmount: 0,
  discount: 0,
  discountType: 'fixed',
  advancePaid: 0,
  balanceDue: 1000,
  total: 1000,
  totalInWords: 'One Thousand Rupees Only',
  thankYouNote: 'THANK YOU!',
  customNotes: 'Thank you for your business.',
  signature: {
    enabled: true,
    type: 'text',
    typedName: 'Authorized Signature',
    title: 'Signature'
  },
  primaryColor: '#0f172a',
  accentBg: '#f1f5f9'
};
