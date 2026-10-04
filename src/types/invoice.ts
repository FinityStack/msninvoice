export interface BankAccount {
  id: string;
  bankName: string; // e.g. "HDFC Bank", "KARUR VYSYA BANK"
  accountNumber: string; // e.g. "50200092297696"
  ifscCode: string; // e.g. "HDFC0007537"
  accountName: string; // e.g. "MSN TOURS & TRAVELS"
  accountType: string; // e.g. "Current" | "Savings"
  branch: string; // e.g. "CROSS CUT Road"
  pinCode?: string; // e.g. "Coimbatore - 641009"
  upiId?: string; // e.g. "msntravels@upi"
}

export interface InvoiceItem {
  id: string;
  sno: number | string;
  title?: string; // e.g. "Program: 3/10/26 to 4/10/26"
  description: string; // e.g. "Program details\nCoimbatore to starling malapuzha Resort\nBus Type : 55 Seater Ac vehicle"
  qty: string | number; // e.g. "-" or 1 or 250
  price: number; // e.g. 33000
  total: number; // e.g. 33000
}

export interface TableHeaders {
  sno: string; // e.g. "S.no"
  description: string; // e.g. "Trip Details" or "Description"
  qty: string; // e.g. "Trip Kms" or "Qty"
  price: string; // e.g. "Price" or "Rate"
  total: string; // e.g. "Total" or "Amount"
}

export interface CompanyDetails {
  name: string;
  tagline?: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  gstin?: string;
  website?: string;
}

export interface ClientDetails {
  label: string; // e.g. "Bill to:"
  name: string; // e.g. "Eye Foundation"
  address: string; // e.g. "Building No./Flat No.: 583A, Periyasamy West Road, RS Puram, Coimbatore, Tamil Nadu,641002"
  phone?: string;
  email?: string;
  taxId?: string;
}

export interface CurrencyConfig {
  code: string; // "INR", "USD", "EUR", "GBP", "AED"
  symbol: string; // "₹", "$", "€", "£", "AED"
  position: 'prefix' | 'suffix';
  suffixText: string; // e.g. "/-" like in the sample "33,000/-"
}

export interface SignatureConfig {
  enabled: boolean;
  type: 'draw' | 'image' | 'text' | 'none';
  dataUrl?: string;
  typedName?: string;
  title: string; // e.g. "Signature" or "Authorized Signatory"
}

export type TemplateId = 'travel-classic' | 'modern-corporate' | 'minimal-editorial' | 'executive-grid';

export interface InvoiceData {
  id: string;
  templateId: TemplateId;
  title: string; // e.g. "INVOICE", "TAX INVOICE"
  invoiceNumber: string; // e.g. "20260927005"
  date: string; // e.g. "2026-09-27"
  dueDate?: string;
  company: CompanyDetails;
  client: ClientDetails;
  currency: CurrencyConfig;
  bankAccounts: BankAccount[];
  tableHeaders: TableHeaders;
  items: InvoiceItem[];
  dutyHours?: string; // e.g. "Duty Hours : - 06:00 am to 6:00 pm."
  subtotal: number;
  taxPercent: number; // e.g. 0, 5, 12, 18
  taxAmount: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  advancePaid: number;
  balanceDue: number;
  total: number;
  totalInWords?: string;
  thankYouNote: string; // e.g. "THANK YOU!"
  customNotes?: string;
  signature: SignatureConfig;
  primaryColor: string; // hex color e.g. "#0f172a"
  accentBg: string; // hex color for table header or badge
}
