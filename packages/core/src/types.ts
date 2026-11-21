/** Fields read from one invoice/receipt. Every field is optional because extraction can fail. */
export interface InvoiceFields {
  /** ISO date, `YYYY-MM-DD`. */
  date?: string;
  vendor?: string;
  amount?: number;
  /** ISO 4217 code, e.g. `USD`, `INR`. */
  currency?: string;
  invoiceNo?: string;
  /** GSTIN (India) or other tax ID. */
  gst?: string;
}

export type InvoiceField = keyof InvoiceFields;
