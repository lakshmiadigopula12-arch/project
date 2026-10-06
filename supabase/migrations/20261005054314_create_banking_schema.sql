/*
# Enterprise Digital Banking Platform — Core Schema

## Overview
Creates the complete database schema for a mock digital banking platform with three portals:
Customer, Employee, and Admin. All data is synthetic/mock — no real banking credentials.

## New Tables
1. branches — Bank branch locations
2. customers — Customer profiles with KYC status
3. accounts — Bank accounts (Savings, Current, Salary, FD, RD)
4. transactions — High-volume transaction records (5M+ mock rows)
5. cards — Debit/Credit cards with limits and status
6. beneficiaries — Saved transfer beneficiaries
7. loans — Loan applications and active loans
8. service_requests — Customer service tickets
9. fraud_alerts — Suspicious transaction alerts
10. notifications — Customer notification center
11. employees — Bank staff with role-based access

## Security
- RLS enabled on all tables
- Policies allow anon + authenticated CRUD (sandbox/training system with mock data)
- No real-money transactions; all data is synthetic
*/

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_code text UNIQUE NOT NULL,
  branch_name text NOT NULL,
  city text NOT NULL,
  address text,
  ifsc_prefix text NOT NULL DEFAULT 'BANK',
  phone text,
  working_hours text DEFAULT '9:00 AM - 5:00 PM',
  services text[] DEFAULT ARRAY['ATM','Cash Deposit','Cash Withdrawal','KYC','Loans','Account Opening'],
  created_at timestamptz DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  dob date,
  mobile text,
  email text,
  address text,
  occupation text,
  pan text,
  kyc_status text NOT NULL DEFAULT 'Pending',
  risk_category text NOT NULL DEFAULT 'Low',
  risk_score integer NOT NULL DEFAULT 0,
  account_status text NOT NULL DEFAULT 'Active',
  registration_date timestamptz DEFAULT now(),
  city text,
  pin_code text,
  password text DEFAULT 'demo123',
  created_at timestamptz DEFAULT now()
);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'Savings',
  branch_id uuid REFERENCES branches(id),
  ifsc text NOT NULL,
  opening_date timestamptz DEFAULT now(),
  available_balance numeric(15,2) NOT NULL DEFAULT 0,
  total_balance numeric(15,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  monthly_credits numeric(15,2) DEFAULT 0,
  monthly_debits numeric(15,2) DEFAULT 0,
  pending_transactions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text UNIQUE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  amount numeric(15,2) NOT NULL,
  debit_credit text NOT NULL DEFAULT 'Debit',
  merchant text,
  category text,
  status text NOT NULL DEFAULT 'Success',
  reference_number text,
  channel text NOT NULL DEFAULT 'Online',
  location text,
  branch_id uuid REFERENCES branches(id),
  balance_after numeric(15,2),
  created_at timestamptz DEFAULT now()
);

-- Cards
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  card_type text NOT NULL DEFAULT 'Debit',
  card_network text NOT NULL DEFAULT 'Visa',
  expiry text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  daily_limit numeric(15,2) NOT NULL DEFAULT 50000,
  available_limit numeric(15,2) NOT NULL DEFAULT 50000,
  cvv text DEFAULT '***',
  created_at timestamptz DEFAULT now()
);

-- Beneficiaries
CREATE TABLE IF NOT EXISTS beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  beneficiary_name text NOT NULL,
  beneficiary_account text NOT NULL,
  beneficiary_ifsc text NOT NULL,
  bank_name text NOT NULL DEFAULT 'Mock Bank',
  nickname text,
  status text NOT NULL DEFAULT 'Active',
  verification_status text NOT NULL DEFAULT 'Verified',
  max_transfer_limit numeric(15,2) DEFAULT 100000,
  created_at timestamptz DEFAULT now()
);

-- Loans
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  loan_type text NOT NULL DEFAULT 'Personal',
  loan_amount numeric(15,2) NOT NULL,
  interest_rate numeric(5,2) NOT NULL DEFAULT 10.5,
  tenure_months integer NOT NULL DEFAULT 12,
  outstanding_amount numeric(15,2) NOT NULL DEFAULT 0,
  emi_amount numeric(15,2) DEFAULT 0,
  next_due_date date,
  paid_amount numeric(15,2) DEFAULT 0,
  remaining_tenure integer DEFAULT 0,
  employment_type text,
  monthly_income numeric(15,2),
  status text NOT NULL DEFAULT 'Draft',
  application_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Service Requests
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Created',
  priority text NOT NULL DEFAULT 'Medium',
  assigned_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fraud Alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id text UNIQUE NOT NULL,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  amount numeric(15,2) NOT NULL,
  location text,
  previous_location text,
  time_difference_minutes integer DEFAULT 0,
  risk_score integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'Open',
  assigned_to text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  mobile text,
  role text NOT NULL DEFAULT 'Customer Service Executive',
  department text NOT NULL DEFAULT 'Operations',
  branch_id uuid REFERENCES branches(id),
  status text NOT NULL DEFAULT 'Active',
  password text DEFAULT 'demo123',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies: sandbox/training system with mock data — allow anon + authenticated CRUD on all tables
-- branches
DROP POLICY IF EXISTS "br_sel" ON branches; CREATE POLICY "br_sel" ON branches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "br_ins" ON branches; CREATE POLICY "br_ins" ON branches FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "br_upd" ON branches; CREATE POLICY "br_upd" ON branches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "br_del" ON branches; CREATE POLICY "br_del" ON branches FOR DELETE TO anon, authenticated USING (true);

-- customers
DROP POLICY IF EXISTS "cu_sel" ON customers; CREATE POLICY "cu_sel" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cu_ins" ON customers; CREATE POLICY "cu_ins" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cu_upd" ON customers; CREATE POLICY "cu_upd" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cu_del" ON customers; CREATE POLICY "cu_del" ON customers FOR DELETE TO anon, authenticated USING (true);

-- accounts
DROP POLICY IF EXISTS "ac_sel" ON accounts; CREATE POLICY "ac_sel" ON accounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ac_ins" ON accounts; CREATE POLICY "ac_ins" ON accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ac_upd" ON accounts; CREATE POLICY "ac_upd" ON accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ac_del" ON accounts; CREATE POLICY "ac_del" ON accounts FOR DELETE TO anon, authenticated USING (true);

-- transactions
DROP POLICY IF EXISTS "tx_sel" ON transactions; CREATE POLICY "tx_sel" ON transactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tx_ins" ON transactions; CREATE POLICY "tx_ins" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tx_upd" ON transactions; CREATE POLICY "tx_upd" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "tx_del" ON transactions; CREATE POLICY "tx_del" ON transactions FOR DELETE TO anon, authenticated USING (true);

-- cards
DROP POLICY IF EXISTS "ca_sel" ON cards; CREATE POLICY "ca_sel" ON cards FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ca_ins" ON cards; CREATE POLICY "ca_ins" ON cards FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ca_upd" ON cards; CREATE POLICY "ca_upd" ON cards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ca_del" ON cards; CREATE POLICY "ca_del" ON cards FOR DELETE TO anon, authenticated USING (true);

-- beneficiaries
DROP POLICY IF EXISTS "bn_sel" ON beneficiaries; CREATE POLICY "bn_sel" ON beneficiaries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "bn_ins" ON beneficiaries; CREATE POLICY "bn_ins" ON beneficiaries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "bn_upd" ON beneficiaries; CREATE POLICY "bn_upd" ON beneficiaries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "bn_del" ON beneficiaries; CREATE POLICY "bn_del" ON beneficiaries FOR DELETE TO anon, authenticated USING (true);

-- loans
DROP POLICY IF EXISTS "ln_sel" ON loans; CREATE POLICY "ln_sel" ON loans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ln_ins" ON loans; CREATE POLICY "ln_ins" ON loans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ln_upd" ON loans; CREATE POLICY "ln_upd" ON loans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ln_del" ON loans; CREATE POLICY "ln_del" ON loans FOR DELETE TO anon, authenticated USING (true);

-- service_requests
DROP POLICY IF EXISTS "sr_sel" ON service_requests; CREATE POLICY "sr_sel" ON service_requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "sr_ins" ON service_requests; CREATE POLICY "sr_ins" ON service_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "sr_upd" ON service_requests; CREATE POLICY "sr_upd" ON service_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "sr_del" ON service_requests; CREATE POLICY "sr_del" ON service_requests FOR DELETE TO anon, authenticated USING (true);

-- fraud_alerts
DROP POLICY IF EXISTS "fa_sel" ON fraud_alerts; CREATE POLICY "fa_sel" ON fraud_alerts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "fa_ins" ON fraud_alerts; CREATE POLICY "fa_ins" ON fraud_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "fa_upd" ON fraud_alerts; CREATE POLICY "fa_upd" ON fraud_alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "fa_del" ON fraud_alerts; CREATE POLICY "fa_del" ON fraud_alerts FOR DELETE TO anon, authenticated USING (true);

-- notifications
DROP POLICY IF EXISTS "nf_sel" ON notifications; CREATE POLICY "nf_sel" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "nf_ins" ON notifications; CREATE POLICY "nf_ins" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "nf_upd" ON notifications; CREATE POLICY "nf_upd" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "nf_del" ON notifications; CREATE POLICY "nf_del" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- employees
DROP POLICY IF EXISTS "em_sel" ON employees; CREATE POLICY "em_sel" ON employees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "em_ins" ON employees; CREATE POLICY "em_ins" ON employees FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "em_upd" ON employees; CREATE POLICY "em_upd" ON employees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "em_del" ON employees; CREATE POLICY "em_del" ON employees FOR DELETE TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_cards_customer_id ON cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_customer_id ON beneficiaries(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON service_requests(customer_id);
