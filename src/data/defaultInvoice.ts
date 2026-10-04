import { InvoiceData } from '../types/invoice';

// Realistic SVG signature matching the sample
export const SAMPLE_SIGNATURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><path d="M 20 60 Q 40 10 55 45 T 75 40 Q 95 20 105 50 T 130 35 Q 150 15 160 55 T 185 45 M 50 48 C 70 42 120 40 170 52 M 70 55 Q 110 30 145 62" fill="none" stroke="%231e293b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Crisp vector bus icon matching MSN Tours logo
export const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="160" height="80"><g fill="%230f172a"><path d="M25 50 c0-12 5-28 20-33 15-5 55-5 70 0 15 5 20 21 20 33 0 4-2 7-6 7 h-98 c-4 0-6-3-6-7 z" fill="%230f172a"/><path d="M38 27 h35 v14 h-35 z" fill="%23ffffff"/><path d="M87 27 h35 v14 h-35 z" fill="%23ffffff"/><circle cx="48" cy="56" r="8" fill="%231e293b"/><circle cx="48" cy="56" r="4" fill="%23e2e8f0"/><circle cx="112" cy="56" r="8" fill="%231e293b"/><circle cx="112" cy="56" r="4" fill="%23e2e8f0"/><path d="M22 45 Q 80 32 138 45" stroke="%23ffffff" stroke-width="1.8" fill="none"/></g></svg>`;

export const DEFAULT_INVOICE: InvoiceData = {
  id: 'inv-20260927005',
  templateId: 'travel-classic',
  title: 'INVOICE',
  invoiceNumber: '20260927005',
  date: '2026-09-27',
  dueDate: '',
  company: {
    name: 'MSN TOURS',
    tagline: 'AND TRAVELS',
    logoUrl: DEFAULT_LOGO_SVG,
    address: '786, 5th St, Tatabad, Gandhipuram,\nCoimbatore, Tamil Nadu 641012',
    phone: '+91 909 505 7007',
    email: 'msntravels7007@gmail.com',
    gstin: '',
    website: ''
  },
  client: {
    label: 'Bill to:',
    name: 'Eye Foundation',
    address: 'Building No./Flat No.: 583A, Periyasamy West Road, RS Puram, Coimbatore, Tamil Nadu,641002',
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
      bankName: 'HDFC Bank',
      accountNumber: '50200092297696',
      ifscCode: 'HDFC0007537',
      accountName: 'MSN TOURS & TRAVELS',
      accountType: 'Current',
      branch: 'CROSS CUT Road',
      pinCode: 'Coimbatore - 641009'
    },
    {
      id: 'bank-2',
      bankName: 'KARUR VYSYA BANK',
      accountNumber: '1697135000003698',
      ifscCode: 'KVBL0001697',
      accountName: 'A.MOHAMMED HUSSAN',
      accountType: 'Current',
      branch: 'Punjai Puliampatti'
    }
  ],
  tableHeaders: {
    sno: 'S.no',
    description: 'Trip Details',
    qty: 'Trip Kms',
    price: 'Price',
    total: 'Total'
  },
  items: [
    {
      id: 'item-1',
      sno: 1,
      title: 'Program\n3/10/26 to 4/10/26',
      description: 'Program details\nCoimbatore to starling malapuzha Resort\n\nBus Type : 55 Seater Ac vehicle',
      qty: '-',
      price: 33000,
      total: 33000
    }
  ],
  dutyHours: 'Duty Hours : - 06:00 am to 6:00 pm.',
  subtotal: 33000,
  taxPercent: 0,
  taxAmount: 0,
  discount: 0,
  discountType: 'fixed',
  advancePaid: 0,
  balanceDue: 33000,
  total: 33000,
  totalInWords: 'Thirty-Three Thousand Rupees Only',
  thankYouNote: 'THANK YOU!',
  customNotes: '',
  signature: {
    enabled: true,
    type: 'draw',
    dataUrl: SAMPLE_SIGNATURE_SVG,
    title: 'Signature'
  },
  primaryColor: '#0f172a',
  accentBg: '#f1f5f9'
};

export const PRESET_TEMPLATES = [
  {
    id: 'travel-classic',
    name: 'Travel & Transport (Classic)',
    description: 'Direct match of the MSN Tours layout with split bank details, duty hours, and clean boxed table.',
    previewColor: '#0f172a'
  },
  {
    id: 'modern-corporate',
    name: 'Modern Corporate',
    description: 'Refined enterprise aesthetic with accent bands, clear financial breakdowns, and tax rates.',
    previewColor: '#1e3a8a'
  },
  {
    id: 'minimal-editorial',
    name: 'Minimal Editorial',
    description: 'Crisp monochrome typography, generous breathing room, and minimalist line borders.',
    previewColor: '#18181b'
  },
  {
    id: 'executive-grid',
    name: 'Executive Grid',
    description: 'High-density multi-column layout with detailed tax, balance due, and terms section.',
    previewColor: '#047857'
  }
];

export const SAMPLE_PRESETS: Record<string, InvoiceData> = {
  msnTours: DEFAULT_INVOICE,
  corporateConsulting: {
    id: 'inv-2026-088',
    templateId: 'modern-corporate',
    title: 'TAX INVOICE',
    invoiceNumber: 'INV-2026-088',
    date: '2026-09-27',
    dueDate: '2026-10-15',
    company: {
      name: 'Apex Strategic Partners',
      tagline: 'Enterprise Advisory & Tech Solutions',
      logoUrl: '',
      address: 'Suite 400, Financial District\nNew Delhi, 110001',
      phone: '+91 11 4567 8900',
      email: 'billing@apexstrategic.com',
      gstin: '07AAACA1234B1Z5',
      website: 'www.apexstrategic.com'
    },
    client: {
      label: 'Billed To:',
      name: 'Horizon Retail Innovations Ltd.',
      address: 'Plot 14, Electronic City Phase 1\nBengaluru, Karnataka 560100',
      phone: '+91 80 2345 6789',
      email: 'accounts@horizoninnovations.com',
      taxId: '29ABCDE1234F1Z8'
    },
    currency: {
      code: 'INR',
      symbol: '₹',
      position: 'prefix',
      suffixText: ''
    },
    bankAccounts: [
      {
        id: 'corp-bank-1',
        bankName: 'ICICI Bank',
        accountNumber: '000405012345',
        ifscCode: 'ICIC0000004',
        accountName: 'APEX STRATEGIC PARTNERS',
        accountType: 'Current Account',
        branch: 'Connaught Place, New Delhi',
        pinCode: '110001',
        upiId: 'apexpartners@icici'
      }
    ],
    tableHeaders: {
      sno: 'Item',
      description: 'Service Description',
      qty: 'Hours',
      price: 'Rate (₹)',
      total: 'Amount (₹)'
    },
    items: [
      {
        id: 'corp-item-1',
        sno: 1,
        title: 'Cloud Infrastructure Audit & Migration',
        description: 'Comprehensive review of multi-cloud architectures, security hardening, and cost reduction modeling.',
        qty: 40,
        price: 3500,
        total: 140000
      },
      {
        id: 'corp-item-2',
        sno: 2,
        title: 'ERP Custom Integration Sprint',
        description: 'Two-week dedicated engineering sprint for billing automation and payment gateway syncing.',
        qty: 60,
        price: 3000,
        total: 180000
      }
    ],
    dutyHours: '',
    subtotal: 320000,
    taxPercent: 18,
    taxAmount: 57600,
    discount: 10000,
    discountType: 'fixed',
    advancePaid: 150000,
    balanceDue: 217600,
    total: 367600,
    totalInWords: 'Three Lakh Sixty-Seven Thousand Six Hundred Rupees Only',
    thankYouNote: 'THANK YOU FOR YOUR BUSINESS!',
    customNotes: 'Payment is due within 15 days of invoice date. Please transfer directly to the ICICI Bank account listed above.',
    signature: {
      enabled: true,
      type: 'text',
      typedName: 'Rajesh Varma',
      title: 'Authorized Signatory'
    },
    primaryColor: '#1e3a8a',
    accentBg: '#eff6ff'
  }
};
