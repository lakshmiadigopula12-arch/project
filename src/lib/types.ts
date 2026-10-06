export type Portal = 'landing' | 'customer' | 'employee' | 'admin';

export type KycStatus = 'Pending' | 'Under Review' | 'Verified' | 'Rejected' | 'Expired';

export type AccountStatus = 'Active' | 'Inactive' | 'Frozen' | 'Closed';

export type TransactionStatus = 'Success' | 'Pending' | 'Failed' | 'Reversed' | 'Under Review';

export type EmployeeRole =
  | 'Customer Service Executive'
  | 'KYC Officer'
  | 'Loan Officer'
  | 'Fraud Analyst'
  | 'Operations Manager'
  | 'Admin';

export interface Customer {
  id: string;
  customer_id: string;
  full_name: string;
  dob: string;
  mobile: string;
  email: string;
  address: string;
  occupation: string;
  pan: string;
  kyc_status: KycStatus;
  risk_category: string;
  risk_score: number;
  account_status: string;
  registration_date: string;
  city: string;
  pin_code: string;
  password: string;
}

export interface Account {
  id: string;
  account_number: string;
  customer_id: string;
  account_type: string;
  branch_id: string;
  ifsc: string;
  opening_date: string;
  available_balance: number;
  total_balance: number;
  status: string;
  monthly_credits: number;
  monthly_debits: number;
  pending_transactions: number;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  account_id: string;
  customer_id: string;
  transaction_date: string;
  type: string;
  amount: number;
  debit_credit: string;
  merchant: string;
  category: string;
  status: TransactionStatus;
  reference_number: string;
  channel: string;
  location: string;
  balance_after: number;
}

export interface Card {
  id: string;
  card_number: string;
  customer_id: string;
  account_id: string;
  card_type: string;
  card_network: string;
  expiry: string;
  status: string;
  daily_limit: number;
  available_limit: number;
}

export interface Beneficiary {
  id: string;
  customer_id: string;
  beneficiary_name: string;
  beneficiary_account: string;
  beneficiary_ifsc: string;
  bank_name: string;
  nickname: string;
  status: string;
  verification_status: string;
  max_transfer_limit: number;
}

export interface Loan {
  id: string;
  loan_id: string;
  customer_id: string;
  loan_type: string;
  loan_amount: number;
  interest_rate: number;
  tenure_months: number;
  outstanding_amount: number;
  emi_amount: number;
  next_due_date: string;
  paid_amount: number;
  remaining_tenure: number;
  employment_type: string;
  monthly_income: number;
  status: string;
  application_date: string;
}

export interface ServiceRequest {
  id: string;
  ticket_id: string;
  customer_id: string;
  request_type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

export interface FraudAlert {
  id: string;
  alert_id: string;
  transaction_id: string;
  customer_id: string;
  alert_type: string;
  amount: number;
  location: string;
  previous_location: string;
  time_difference_minutes: number;
  risk_score: number;
  status: string;
  assigned_to: string;
  description: string;
  created_at: string;
}

export interface Notification {
  id: string;
  customer_id: string;
  category: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  mobile: string;
  role: EmployeeRole;
  department: string;
  branch_id: string;
  status: string;
  password: string;
}

export interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  city: string;
  address: string;
  ifsc_prefix: string;
  phone: string;
  working_hours: string;
  services: string[];
}
