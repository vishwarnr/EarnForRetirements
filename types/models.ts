// -------------------------------------------------------------
// types/models.ts
// Core data models for the EarnForRetirement – Recycle & Earn MVP
// -------------------------------------------------------------

export interface CustomerTemplate {
  label: string;
  customerId: string;
  companyId: string;
}

export interface DocumentUploadResult {
  documentId: string;
  customer: string;
  createdCompany: string;
}

export interface DocumentStatus {
  status: string;
  document_no?: string;
  validation_errors?: string[];
}

export type DocumentCategory = string;

/**
 * A saved scan record for the user's history.
 */
export interface UploadHistoryItem {
  id: string;
  documentId: string;
  filename: string;
  date: string;
  category: string;
  templateLabel: string;
  status: string;
}

export interface LoggedInUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  role: string;
  company_registration_ids: number[];
}
