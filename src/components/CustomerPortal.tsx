import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, CreditCard, Landmark,
  Bell, FileText, Users, Phone, Settings, Search, Filter,
  TrendingUp, TrendingDown, Plus, Trash2, Edit2, Download,
  CheckCircle2, AlertTriangle, Clock, Shield, Calculator
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PortalLayout, NavItem } from '@/components/PortalLayout';
import {
  Card,
  StatCard,
  Badge,
  LoadingSpinner,
  EmptyState,
  Pagination,
  Input,
  Select,
  Button,
  getStatusBadgeColor
} from '@/components/ui';
import { SupportWidget } from '@/components/SupportWidget';
import { supabase } from '@/lib/supabase';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  maskAccountNumber,
  maskCardNumber,
  generateTransactionId,
  generateReferenceNumber,
  BANK_INFO
} from '@/lib/constants';
import type {
  Account,
  Transaction,
  Card as CardType,
  Beneficiary,
  Loan,
  Notification,
  ServiceRequest,
  Branch
} from '@/lib/types';
import './CustomerPortal.css';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'accounts', label: 'Accounts', icon: <Wallet size={18} /> },
  { id: 'transactions', label: 'Transactions', icon: <Search size={18} /> },
  { id: 'transfer', label: 'Fund Transfer', icon: <ArrowLeftRight size={18} /> },
  { id: 'beneficiaries', label: 'Beneficiaries', icon: <Users size={18} /> },
  { id: 'cards', label: 'Cards', icon: <CreditCard size={18} /> },
  { id: 'loans', label: 'Loans', icon: <Landmark size={18} /> },
  { id: 'statements', label: 'Statements', icon: <FileText size={18} /> },
  { id: 'service', label: 'Service Requests', icon: <Settings size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'locator', label: 'Branch/ATM Locator', icon: <Phone size={18} /> },
];

export function CustomerPortal() {
  const { loggedInCustomer } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (!loggedInCustomer) return null;

  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userName={loggedInCustomer.full_name}
      userRole={`Customer · ${loggedInCustomer.customer_id}`}
      portalName="Customer Portal"
      accentColor="#006D77"
    >
      {activeSection === 'dashboard' && <CustomerDashboard />}
      {activeSection === 'accounts' && <AccountsView />}
      {activeSection === 'transactions' && <TransactionsView />}
      {activeSection === 'transfer' && <FundTransferView />}
      {activeSection === 'beneficiaries' && <BeneficiariesView />}
      {activeSection === 'cards' && <CardsView />}
      {activeSection === 'loans' && <LoansView />}
      {activeSection === 'statements' && <StatementsView />}
      {activeSection === 'service' && <ServiceRequestsView />}
      {activeSection === 'notifications' && <NotificationsView />}
      {activeSection === 'locator' && <LocatorView />}
      <SupportWidget />
    </PortalLayout>
  );
}

function useCustomerData<T>(table: string, customerId: string, select = '*') {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);

      const { data: result } = await supabase
        .from(table)
        .select(select)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (active) {
        setData((result || []) as T[]);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [table, customerId, select]);

  return { data, loading, setData };
}

function CustomerDashboard() {
  const { loggedInCustomer } = useAuth();

  const { data: accounts, loading } =
    useCustomerData<Account>('accounts', loggedInCustomer!.id);

  const { data: transactions } =
    useCustomerData<Transaction>(
      'transactions',
      loggedInCustomer!.id,
      '*,accounts!inner(account_number)'
    );

  const { data: cards } =
    useCustomerData<CardType>('cards', loggedInCustomer!.id);

  const { data: loans } =
    useCustomerData<Loan>('loans', loggedInCustomer!.id);

  const { data: notifications } =
    useCustomerData<Notification>('notifications', loggedInCustomer!.id);

  const totalBalance = accounts.reduce(
    (sum, a) => sum + Number(a.available_balance),
    0
  );

  const monthlyCredits = accounts.reduce(
    (sum, a) => sum + Number(a.monthly_credits),
    0
  );

  const monthlyDebits = accounts.reduce(
    (sum, a) => sum + Number(a.monthly_debits),
    0
  );

  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const activeLoans = loans.filter(
    l => l.status === 'Approved' || l.status === 'Disbursed'
  ).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="customer-section customer-stack-lg">

      <div className="customer-welcome-card">
        <h2>Welcome back, {loggedInCustomer!.full_name}</h2>

        <p>
          {loggedInCustomer!.customer_id} · KYC:{' '}
          <span>{loggedInCustomer!.kyc_status}</span>
        </p>
      </div>

      <div className="customer-stats-grid">
        <StatCard
          label="Total Balance"
          value={formatCurrency(totalBalance)}
          icon={<Wallet size={22} />}
          color="#006D77"
        />

        <StatCard
          label="Monthly Credits"
          value={formatCurrency(monthlyCredits)}
          icon={<TrendingUp size={22} />}
          color="#00B4D8"
        />

        <StatCard
          label="Monthly Debits"
          value={formatCurrency(monthlyDebits)}
          icon={<TrendingDown size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Active Cards"
          value={String(cards.length)}
          icon={<CreditCard size={22} />}
          color="#FFFFFF"
        />

        <StatCard
          label="Active Loans"
          value={String(activeLoans)}
          icon={<Landmark size={22} />}
          color="#006D77"
        />

        <StatCard
          label="Total Accounts"
          value={String(accounts.length)}
          icon={<Wallet size={22} />}
          color="#00B4D8"
        />

        <StatCard
          label="Unread Notifications"
          value={String(unreadNotifs)}
          icon={<Bell size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Risk Score"
          value={`${loggedInCustomer!.risk_score}/100`}
          icon={<Shield size={22} />}
          color={
            loggedInCustomer!.risk_score > 70
              ? '#FF8A80'
              : '#FFFFFF'
          }
          subtext={`${loggedInCustomer!.risk_category} Risk`}
        />
      </div>

      <div className="customer-two-column">

        <Card className="customer-card-padding">
          <h3 className="customer-card-title">
            Recent Transactions
          </h3>

          <div className="customer-list">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="customer-transaction-row"
              >
                <div className="customer-row-left">

                  <div
                    className={
                      tx.debit_credit === 'Credit'
                        ? 'customer-amount-icon customer-credit-icon'
                        : 'customer-amount-icon customer-debit-icon'
                    }
                  >
                    {tx.debit_credit === 'Credit'
                      ? <TrendingUp size={18} />
                      : <TrendingDown size={18} />}
                  </div>

                  <div>
                    <p className="customer-primary-text">
                      {tx.merchant || tx.type}
                    </p>

                    <p className="customer-muted-text">
                      {formatDate(tx.transaction_date)}
                    </p>
                  </div>
                </div>

                <div className="customer-row-right">
                  <p
                    className={
                      tx.debit_credit === 'Credit'
                        ? 'customer-credit-text'
                        : 'customer-debit-text'
                    }
                  >
                    {tx.debit_credit === 'Credit' ? '+' : '-'}
                    {formatCurrency(Number(tx.amount))}
                  </p>

                  <Badge
                    text={tx.status}
                    color={getStatusBadgeColor(tx.status)}
                  />
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <EmptyState
                icon={<FileText size={28} />}
                title="No transactions yet"
                message="Your recent transactions will appear here."
              />
            )}
          </div>
        </Card>

        <Card className="customer-card-padding">
          <h3 className="customer-card-title">
            My Accounts
          </h3>

          <div className="customer-list">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="customer-transaction-row"
              >
                <div>
                  <p className="customer-primary-text">
                    {acc.account_type} Account
                  </p>

                  <p className="customer-muted-mono">
                    {maskAccountNumber(acc.account_number)}
                  </p>
                </div>

                <div className="customer-row-right">
                  <p className="customer-balance-text">
                    {formatCurrency(Number(acc.available_balance))}
                  </p>

                  <Badge
                    text={acc.status}
                    color={getStatusBadgeColor(acc.status)}
                  />
                </div>
              </div>
            ))}

            {accounts.length === 0 && (
              <EmptyState
                icon={<Wallet size={28} />}
                title="No accounts"
                message="Your accounts will appear here."
              />
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}

function AccountsView() {
  const { loggedInCustomer } = useAuth();

  const { data: accounts, loading } =
    useCustomerData<Account>('accounts', loggedInCustomer!.id);

  const { data: transactions } =
    useCustomerData<Transaction>('transactions', loggedInCustomer!.id);

  const [selectedAccount, setSelectedAccount] =
    useState<Account | null>(null);

  if (loading) return <LoadingSpinner />;

  if (selectedAccount) {
    const accTxs = transactions
      .filter(t => t.account_id === selectedAccount.id)
      .slice(0, 10);

    return (
      <div className="customer-section customer-stack-lg">

        <button
          onClick={() => setSelectedAccount(null)}
          className="customer-back-button"
        >
          <ArrowLeftRight size={16} />
          Back to Accounts
        </button>

        <Card className="customer-card-padding-lg">

          <div className="customer-account-header">
            <div>
              <h3 className="customer-page-title">
                {selectedAccount.account_type} Account
              </h3>

              <p className="customer-muted-mono customer-margin-top">
                {maskAccountNumber(selectedAccount.account_number)}
              </p>

              <p className="customer-small-text">
                IFSC: {selectedAccount.ifsc}
              </p>

              <p className="customer-small-text">
                Opened: {formatDate(selectedAccount.opening_date)}
              </p>
            </div>

            <Badge
              text={selectedAccount.status}
              color={getStatusBadgeColor(selectedAccount.status)}
            />
          </div>

          <div className="customer-four-column-grid">

            <div className="customer-info-box customer-info-teal">
              <p className="customer-label">Available Balance</p>
              <p className="customer-info-value customer-teal-text">
                {formatCurrency(Number(selectedAccount.available_balance))}
              </p>
            </div>

            <div className="customer-info-box customer-info-white">
              <p className="customer-label">Total Balance</p>
              <p className="customer-info-value">
                {formatCurrency(Number(selectedAccount.total_balance))}
              </p>
            </div>

            <div className="customer-info-box customer-info-credit">
              <p className="customer-label">Monthly Credits</p>
              <p className="customer-info-value customer-credit-text">
                {formatCurrency(Number(selectedAccount.monthly_credits))}
              </p>
            </div>

            <div className="customer-info-box customer-info-debit">
              <p className="customer-label">Monthly Debits</p>
              <p className="customer-info-value customer-debit-text">
                {formatCurrency(Number(selectedAccount.monthly_debits))}
              </p>
            </div>

          </div>

          <h4 className="customer-subtitle">
            Recent Transactions
          </h4>

          <div className="customer-list">
            {accTxs.map((tx) => (
              <div
                key={tx.id}
                className="customer-transaction-row"
              >
                <div>
                  <p className="customer-primary-text">
                    {tx.merchant || tx.type}
                  </p>

                  <p className="customer-muted-text">
                    {formatDateTime(tx.transaction_date)} · {tx.channel}
                  </p>
                </div>

                <p
                  className={
                    tx.debit_credit === 'Credit'
                      ? 'customer-credit-text'
                      : 'customer-debit-text'
                  }
                >
                  {tx.debit_credit === 'Credit' ? '+' : '-'}
                  {formatCurrency(Number(tx.amount))}
                </p>
              </div>
            ))}
          </div>

        </Card>
      </div>
    );
  }

  return (
    <div className="customer-section customer-stack-md">

      <h3 className="customer-page-heading">
        My Accounts
      </h3>

      <div className="customer-two-column-grid">

        {accounts.map((acc) => (
          <Card
            key={acc.id}
            className="customer-card-padding customer-clickable-card"
          >
            <div
              onClick={() => setSelectedAccount(acc)}
              className="customer-account-card-header"
            >
              <div>

                <div className="customer-inline">
                  <Wallet
                    className="customer-teal-icon"
                    size={20}
                  />

                  <h4 className="customer-card-heading">
                    {acc.account_type} Account
                  </h4>
                </div>

                <p className="customer-muted-mono">
                  {maskAccountNumber(acc.account_number)}
                </p>
              </div>

              <Badge
                text={acc.status}
                color={getStatusBadgeColor(acc.status)}
              />
            </div>

            <div className="customer-detail-list">

              <Row
                label="Available Balance"
                value={formatCurrency(Number(acc.available_balance))}
                highlight
              />

              <Row
                label="IFSC"
                value={acc.ifsc}
              />

              <Row
                label="Monthly Credits"
                value={formatCurrency(Number(acc.monthly_credits))}
                valueClass="customer-credit-text"
              />

              <Row
                label="Monthly Debits"
                value={formatCurrency(Number(acc.monthly_debits))}
                valueClass="customer-debit-text"
              />

            </div>
          </Card>
        ))}

        {accounts.length === 0 && (
          <EmptyState
            icon={<Wallet size={28} />}
            title="No accounts"
            message="You do not have any accounts yet."
          />
        )}

      </div>
    </div>
  );
}

function TransactionsView() {
  const { loggedInCustomer } = useAuth();

  const { data: allTx, loading } =
    useCustomerData<Transaction>(
      'transactions',
      loggedInCustomer!.id
    );

  const [filters, setFilters] = useState({
    type: '',
    status: '',
    channel: '',
    minAmount: '',
    maxAmount: '',
    search: ''
  });

  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 15;

  const filtered = allTx.filter((tx) => {
    if (filters.type && tx.type !== filters.type) return false;
    if (filters.status && tx.status !== filters.status) return false;
    if (filters.channel && tx.channel !== filters.channel) return false;

    if (
      filters.minAmount &&
      Number(tx.amount) < Number(filters.minAmount)
    ) {
      return false;
    }

    if (
      filters.maxAmount &&
      Number(tx.amount) > Number(filters.maxAmount)
    ) {
      return false;
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();

      if (
        !tx.merchant?.toLowerCase().includes(s) &&
        !tx.type.toLowerCase().includes(s) &&
        !tx.category?.toLowerCase().includes(s)
      ) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);

  const paged = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalDebit = filtered
    .filter(t => t.debit_credit === 'Debit')
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalCredit = filtered
    .filter(t => t.debit_credit === 'Credit')
    .reduce((s, t) => s + Number(t.amount), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="customer-section customer-stack-md">

      <div className="customer-toolbar">
        <h3 className="customer-page-heading">
          Transaction Search Engine
        </h3>

        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className="customer-inline">
            <Filter size={16} />
            Filters
          </span>
        </Button>
      </div>

      <div className="customer-three-column-grid">

        <StatCard
          label="Total Transactions"
          value={String(filtered.length)}
          icon={<FileText size={22} />}
          color="#006D77"
        />

        <StatCard
          label="Total Credits"
          value={formatCurrency(totalCredit)}
          icon={<TrendingUp size={22} />}
          color="#00B4D8"
        />

        <StatCard
          label="Total Debits"
          value={formatCurrency(totalDebit)}
          icon={<TrendingDown size={22} />}
          color="#FF8A80"
        />

      </div>

      <div className="customer-search-wrapper">
        <Search
          className="customer-search-icon"
          size={18}
        />

        <input
          type="text"
          placeholder="Search by merchant, type, or category..."
          value={filters.search}
          onChange={(e) => {
            setFilters({
              ...filters,
              search: e.target.value
            });
            setPage(1);
          }}
          className="customer-search-input"
        />
      </div>

      {showFilters && (
        <Card className="customer-card-padding">

          <div className="customer-filter-grid">

            <Select
              label="Type"
              value={filters.type}
              onChange={(v) => {
                setFilters({ ...filters, type: v });
                setPage(1);
              }}
              options={[
                'Debit',
                'Credit',
                'Transfer',
                'Bill Payment',
                'ATM',
                'Card',
                'UPI',
                'Interest',
                'Fee',
                'Refund'
              ].map(t => ({
                value: t,
                label: t
              }))}
            />

            <Select
              label="Status"
              value={filters.status}
              onChange={(v) => {
                setFilters({ ...filters, status: v });
                setPage(1);
              }}
              options={[
                'Success',
                'Pending',
                'Failed',
                'Reversed',
                'Under Review'
              ].map(t => ({
                value: t,
                label: t
              }))}
            />

            <Select
              label="Channel"
              value={filters.channel}
              onChange={(v) => {
                setFilters({ ...filters, channel: v });
                setPage(1);
              }}
              options={[
                'Online',
                'ATM',
                'UPI',
                'Card',
                'Mobile'
              ].map(t => ({
                value: t,
                label: t
              }))}
            />

            <Input
              label="Min Amount"
              type="number"
              value={filters.minAmount}
              onChange={(v) => {
                setFilters({
                  ...filters,
                  minAmount: v
                });
                setPage(1);
              }}
              placeholder="0"
            />

            <Input
              label="Max Amount"
              type="number"
              value={filters.maxAmount}
              onChange={(v) => {
                setFilters({
                  ...filters,
                  maxAmount: v
                });
                setPage(1);
              }}
              placeholder="999999"
            />

          </div>

          <div className="customer-margin-top">
            <Button
              variant="danger"
              onClick={() => {
                setFilters({
                  type: '',
                  status: '',
                  channel: '',
                  minAmount: '',
                  maxAmount: '',
                  search: ''
                });
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>

        </Card>
      )}

      <Card className="customer-table-card">

        <div className="customer-table-wrapper">

          <table className="customer-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Merchant</th>
                <th>Channel</th>
                <th className="customer-align-right">Amount</th>
                <th className="customer-align-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {paged.map((tx) => (
                <tr key={tx.id}>

                  <td>{formatDateTime(tx.transaction_date)}</td>

                  <td>{tx.type}</td>

                  <td>{tx.merchant || '-'}</td>

                  <td>{tx.channel}</td>

                  <td
                    className={
                      tx.debit_credit === 'Credit'
                        ? 'customer-align-right customer-credit-text'
                        : 'customer-align-right customer-debit-text'
                    }
                  >
                    {tx.debit_credit === 'Credit' ? '+' : '-'}
                    {formatCurrency(Number(tx.amount))}
                  </td>

                  <td className="customer-align-center">
                    <Badge
                      text={tx.status}
                      color={getStatusBadgeColor(tx.status)}
                    />
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>

        {paged.length === 0 && (
          <EmptyState
            icon={<FileText size={28} />}
            title="No transactions found"
            message="Try adjusting your filters."
          />
        )}

      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

    </div>
  );
}

function FundTransferView() {
  const { loggedInCustomer } = useAuth();

  const { data: accounts } =
    useCustomerData<Account>(
      'accounts',
      loggedInCustomer!.id
    );

  const { data: beneficiaries } =
    useCustomerData<Beneficiary>(
      'beneficiaries',
      loggedInCustomer!.id
    );

  const { data: transactions } =
    useCustomerData<Transaction>(
      'transactions',
      loggedInCustomer!.id
    );

  const [step, setStep] = useState(1);
  const [fromAccount, setFromAccount] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const [receipt, setReceipt] = useState<{
    txnId: string;
    ref: string;
    from: string;
    to: string;
    amount: string;
    date: string;
  } | null>(null);

  const [error, setError] = useState('');

  const activeAccounts =
    accounts.filter(a => a.status === 'Active');

  const activeBeneficiaries =
    beneficiaries.filter(b => b.status === 'Active');

  const transferHistory =
    transactions
      .filter(t => t.type === 'Transfer')
      .slice(0, 5);

  const handleTransfer = async () => {
    setError('');

    if (step === 1) {
      if (!fromAccount) {
        return setError('Please select an account.');
      }

      setStep(2);

    } else if (step === 2) {
      if (!beneficiary) {
        return setError('Please select a beneficiary.');
      }

      setStep(3);

    } else if (step === 3) {
      if (!amount || Number(amount) <= 0) {
        return setError('Please enter a valid amount.');
      }

      const acc = accounts.find(a => a.id === fromAccount);

      if (
        acc &&
        Number(amount) > Number(acc.available_balance)
      ) {
        return setError('Insufficient balance.');
      }

      setStep(4);

    } else if (step === 4) {
      setStep(5);

    } else if (step === 5) {

      if (otp !== generatedOtp) {
        return setError('Incorrect OTP. Please try again.');
      }

      const fromAcc =
        accounts.find(a => a.id === fromAccount);

      const ben =
        beneficiaries.find(b => b.id === beneficiary);

      if (!fromAcc || !ben) {
        return setError('Transfer details not found.');
      }

      const txnId = generateTransactionId();
      const ref = generateReferenceNumber();

      await supabase.from('transactions').insert({
        transaction_id: txnId,
        account_id: fromAccount,
        customer_id: loggedInCustomer!.id,
        transaction_date: new Date().toISOString(),
        type: 'Transfer',
        amount: Number(amount),
        debit_credit: 'Debit',
        merchant: ben.beneficiary_name,
        category: 'Transfer',
        status: 'Success',
        reference_number: ref,
        channel: 'Online',
        location: loggedInCustomer!.city,
        balance_after:
          Number(fromAcc.available_balance) -
          Number(amount),
      });

      await supabase
        .from('accounts')
        .update({
          available_balance:
            Number(fromAcc.available_balance) -
            Number(amount),

          total_balance:
            Number(fromAcc.total_balance) -
            Number(amount),

          monthly_debits:
            Number(fromAcc.monthly_debits) +
            Number(amount),
        })
        .eq('id', fromAccount);

      setReceipt({
        txnId,
        ref,
        from: fromAcc.account_number,
        to: ben.beneficiary_account,
        amount,
        date: new Date().toISOString()
      });

      setStep(6);
    }
  };

  const generateOtp = () => {
    const o =
      Math.floor(
        100000 + Math.random() * 900000
      ).toString();

    setGeneratedOtp(o);
    setStep(5);
  };

  if (receipt) {
    return (
      <div className="customer-max-width-small">

        <Card className="customer-card-padding-xl customer-text-center">

          <div className="customer-success-circle">
            <CheckCircle2
              className="customer-success-icon"
              size={36}
            />
          </div>

          <h3 className="customer-page-title">
            Transfer Successful!
          </h3>

          <p className="customer-muted-text customer-bottom-space">
            Your money has been transferred successfully.
          </p>

          <div className="customer-receipt-box">
            <Row label="Transaction ID" value={receipt.txnId} />
            <Row label="Reference Number" value={receipt.ref} />
            <Row
              label="From Account"
              value={maskAccountNumber(receipt.from)}
            />
            <Row
              label="To Account"
              value={maskAccountNumber(receipt.to)}
            />
            <Row
              label="Amount"
              value={formatCurrency(Number(receipt.amount))}
            />
            <Row
              label="Date"
              value={formatDateTime(receipt.date)}
            />
            <Row label="Status" value="Success" />
          </div>

          <Button
            className="customer-margin-top-lg"
            onClick={() => {
              setReceipt(null);
              setStep(1);
              setFromAccount('');
              setBeneficiary('');
              setAmount('');
              setOtp('');
            }}
          >
            New Transfer
          </Button>

        </Card>
      </div>
    );
  }

  return (
    <div className="customer-section customer-stack-lg">

      <h3 className="customer-page-heading">
        Fund Transfer
      </h3>

      <div className="customer-transfer-steps">

        {[
          'Select Account',
          'Beneficiary',
          'Amount',
          'Review',
          'OTP',
          'Confirm'
        ].map((s, i) => (
          <div
            key={s}
            className="customer-step-wrapper"
          >

            <div
              className={
                step > i + 1
                  ? 'customer-step customer-step-complete'
                  : step === i + 1
                    ? 'customer-step customer-step-active'
                    : 'customer-step customer-step-pending'
              }
            >
              {step > i + 1
                ? <CheckCircle2 size={16} />
                : i + 1}
            </div>

            <span
              className={
                step >= i + 1
                  ? 'customer-step-label customer-step-label-active'
                  : 'customer-step-label'
              }
            >
              {s}
            </span>

            {i < 5 && (
              <div
                className={
                  step > i + 1
                    ? 'customer-step-line customer-step-line-active'
                    : 'customer-step-line'
                }
              />
            )}

          </div>
        ))}

      </div>

      <Card className="customer-card-padding customer-transfer-card">

        {error && (
          <div className="customer-error-box">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="customer-stack-sm">

            <h4 className="customer-subtitle">
              Select Source Account
            </h4>

            {activeAccounts.map((acc) => (
              <label
                key={acc.id}
                className={
                  fromAccount === acc.id
                    ? 'customer-selection-card customer-selection-active'
                    : 'customer-selection-card'
                }
              >

                <div className="customer-account-selection">

                  <div className="customer-inline-lg">

                    <input
                      type="radio"
                      name="fromAccount"
                      checked={fromAccount === acc.id}
                      onChange={() => setFromAccount(acc.id)}
                      className="customer-radio"
                    />

                    <div>
                      <p className="customer-primary-text">
                        {acc.account_type} Account
                      </p>

                      <p className="customer-muted-mono">
                        {maskAccountNumber(acc.account_number)}
                      </p>
                    </div>

                  </div>

                  <p className="customer-balance-text">
                    {formatCurrency(
                      Number(acc.available_balance)
                    )}
                  </p>

                </div>

              </label>
            ))}

          </div>
        )}

        {step === 2 && (
          <div className="customer-stack-sm">

            <h4 className="customer-subtitle">
              Select Beneficiary
            </h4>

            {activeBeneficiaries.map((ben) => (
              <label
                key={ben.id}
                className={
                  beneficiary === ben.id
                    ? 'customer-selection-card customer-selection-active'
                    : 'customer-selection-card'
                }
              >

                <div className="customer-account-selection">

                  <div className="customer-inline-lg">

                    <input
                      type="radio"
                      name="beneficiary"
                      checked={beneficiary === ben.id}
                      onChange={() =>
                        setBeneficiary(ben.id)
                      }
                      className="customer-radio"
                    />

                    <div>
                      <p className="customer-primary-text">
                        {ben.beneficiary_name}
                      </p>

                      <p className="customer-muted-mono">
                        {maskAccountNumber(
                          ben.beneficiary_account
                        )}
                        {' · '}
                        {ben.beneficiary_ifsc}
                      </p>
                    </div>

                  </div>

                  <p className="customer-small-text">
                    Max:{' '}
                    {formatCurrency(
                      Number(ben.max_transfer_limit)
                    )}
                  </p>

                </div>

              </label>
            ))}

            {activeBeneficiaries.length === 0 && (
              <EmptyState
                icon={<Users size={28} />}
                title="No beneficiaries"
                message="Add a beneficiary first to transfer funds."
              />
            )}

          </div>
        )}

        {step === 3 && (
          <div className="customer-stack-md">

            <h4 className="customer-subtitle">
              Enter Transfer Amount
            </h4>

            <Input
              label="Amount (INR)"
              type="number"
              value={amount}
              onChange={setAmount}
              placeholder="e.g. 5000"
              required
            />

            <div className="customer-info-box customer-info-aqua">
              Available Balance:{' '}
              {formatCurrency(
                Number(
                  accounts.find(
                    a => a.id === fromAccount
                  )?.available_balance || 0
                )
              )}
            </div>

          </div>
        )}

        {step === 4 && (
          <div className="customer-stack-sm">

            <h4 className="customer-subtitle">
              Review Transfer Details
            </h4>

            <div className="customer-receipt-box">

              <Row
                label="From"
                value={maskAccountNumber(
                  accounts.find(
                    a => a.id === fromAccount
                  )?.account_number || ''
                )}
              />

              <Row
                label="To"
                value={
                  beneficiaries.find(
                    b => b.id === beneficiary
                  )?.beneficiary_name || ''
                }
              />

              <Row
                label="Beneficiary Account"
                value={maskAccountNumber(
                  beneficiaries.find(
                    b => b.id === beneficiary
                  )?.beneficiary_account || ''
                )}
              />

              <Row
                label="Amount"
                value={formatCurrency(Number(amount))}
              />

              <Row
                label="Channel"
                value="Online Banking"
              />

            </div>

          </div>
        )}

        {step === 5 && (
          <div className="customer-stack-md">

            <h4 className="customer-subtitle">
              OTP Verification
            </h4>

            <div className="customer-warning-box">
              <Clock size={16} />
              OTP sent to your registered mobile
              {' '}
              (Demo OTP:
              {' '}
              <strong>{generatedOtp}</strong>)
            </div>

            <Input
              label="Enter OTP"
              value={otp}
              onChange={setOtp}
              placeholder="6-digit OTP"
              required
            />

          </div>
        )}

        {step === 6 && (
          <div className="customer-processing">

            <div className="customer-success-circle">
              <CheckCircle2
                className="customer-success-icon"
                size={36}
              />
            </div>

            <p className="customer-processing-text">
              Processing transfer...
            </p>

          </div>
        )}

        {step < 6 && (
          <div className="customer-button-row">

            {step > 1 && step < 5 && (
              <Button
                variant="secondary"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}

            {step === 4 ? (
              <Button onClick={generateOtp}>
                Send OTP
              </Button>
            ) : (
              step < 5 && (
                <Button onClick={handleTransfer}>
                  Next
                </Button>
              )
            )}

            {step === 5 && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setStep(4)}
                >
                  Back
                </Button>

                <Button onClick={handleTransfer}>
                  Confirm Transfer
                </Button>
              </>
            )}

          </div>
        )}

      </Card>

      {transferHistory.length > 0 && (
        <Card className="customer-card-padding">

          <h4 className="customer-subtitle">
            Recent Transfers
          </h4>

          <div className="customer-list">

            {transferHistory.map((tx) => (
              <div
                key={tx.id}
                className="customer-transaction-row"
              >

                <div>
                  <p className="customer-primary-text">
                    {tx.merchant}
                  </p>

                  <p className="customer-muted-text">
                    {formatDateTime(tx.transaction_date)}
                    {' · '}
                    {tx.reference_number}
                  </p>
                </div>

                <div className="customer-row-right">

                  <p className="customer-debit-text">
                    -{formatCurrency(Number(tx.amount))}
                  </p>

                  <Badge
                    text={tx.status}
                    color={getStatusBadgeColor(tx.status)}
                  />

                </div>

              </div>
            ))}

          </div>

        </Card>
      )}

    </div>
  );
}

function BeneficiariesView() {
  const { loggedInCustomer } = useAuth();

  const {
    data: beneficiaries,
    loading,
    setData
  } = useCustomerData<Beneficiary>(
    'beneficiaries',
    loggedInCustomer!.id
  );

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    account: '',
    ifsc: '',
    bank: '',
    nickname: ''
  });

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const handleAdd = async () => {
    if (!form.name || !form.account || !form.ifsc) return;

    if (editingId) {

      await supabase
        .from('beneficiaries')
        .update({
          beneficiary_name: form.name,
          beneficiary_account: form.account,
          beneficiary_ifsc: form.ifsc,
          bank_name: form.bank || 'Mock Bank',
          nickname: form.nickname,
        })
        .eq('id', editingId);

    } else {

      const { data: newBen } =
        await supabase
          .from('beneficiaries')
          .insert({
            customer_id: loggedInCustomer!.id,
            beneficiary_name: form.name,
            beneficiary_account: form.account,
            beneficiary_ifsc: form.ifsc,
            bank_name: form.bank || 'Mock Bank',
            nickname: form.nickname,
            status: 'Active',
            verification_status: 'Verified',
            max_transfer_limit: 100000,
          })
          .select('*');

      if (newBen) {
        setData([
          newBen[0] as Beneficiary,
          ...beneficiaries
        ]);
      }
    }

    setForm({
      name: '',
      account: '',
      ifsc: '',
      bank: '',
      nickname: ''
    });

    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await supabase
      .from('beneficiaries')
      .delete()
      .eq('id', id);

    setData(
      beneficiaries.filter(
        b => b.id !== id
      )
    );
  };

  const handleEdit = (ben: Beneficiary) => {
    setForm({
      name: ben.beneficiary_name,
      account: ben.beneficiary_account,
      ifsc: ben.beneficiary_ifsc,
      bank: ben.bank_name,
      nickname: ben.nickname || ''
    });

    setEditingId(ben.id);
    setShowForm(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="customer-section customer-stack-md">

      <div className="customer-toolbar">

        <h3 className="customer-page-heading">
          Beneficiaries
        </h3>

        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);

            setForm({
              name: '',
              account: '',
              ifsc: '',
              bank: '',
              nickname: ''
            });
          }}
        >
          <span className="customer-inline">
            <Plus size={16} />
            Add Beneficiary
          </span>
        </Button>

      </div>

      {showForm && (
        <Card className="customer-card-padding">

          <h4 className="customer-subtitle customer-margin-bottom">
            {editingId
              ? 'Edit Beneficiary'
              : 'Add New Beneficiary'}
          </h4>

          <div className="customer-two-column-grid">

            <Input
              label="Beneficiary Name"
              value={form.name}
              onChange={(v) =>
                setForm({
                  ...form,
                  name: v
                })
              }
              placeholder="Full name"
              required
            />

            <Input
              label="Account Number"
              value={form.account}
              onChange={(v) =>
                setForm({
                  ...form,
                  account: v
                })
              }
              placeholder="Account number"
              required
            />

            <Input
              label="IFSC Code"
              value={form.ifsc}
              onChange={(v) =>
                setForm({
                  ...form,
                  ifsc: v
                })
              }
              placeholder="e.g. BANK000001"
              required
            />

            <Input
              label="Bank Name"
              value={form.bank}
              onChange={(v) =>
                setForm({
                  ...form,
                  bank: v
                })
              }
              placeholder="Bank name"
            />

            <Input
              label="Nickname"
              value={form.nickname}
              onChange={(v) =>
                setForm({
                  ...form,
                  nickname: v
                })
              }
              placeholder="Optional nickname"
            />

          </div>

          <div className="customer-button-row customer-margin-top">

            <Button onClick={handleAdd}>
              {editingId ? 'Update' : 'Add Beneficiary'}
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>

          </div>

        </Card>
      )}

      <div className="customer-two-column-grid">

        {beneficiaries.map((ben) => (
          <Card
            key={ben.id}
            className="customer-card-padding"
          >

            <div className="customer-account-header">

              <div>

                <h4 className="customer-card-heading">
                  {ben.beneficiary_name}
                </h4>

                <p className="customer-muted-mono">
                  {maskAccountNumber(
                    ben.beneficiary_account
                  )}
                </p>

                <p className="customer-small-text">
                  IFSC: {ben.beneficiary_ifsc}
                  {' · '}
                  {ben.bank_name}
                </p>

                {ben.nickname && (
                  <p className="customer-aqua-text customer-small-margin">
                    aka {ben.nickname}
                  </p>
                )}

              </div>

              <div className="customer-icon-button-row">

                <button
                  onClick={() => handleEdit(ben)}
                  className="customer-icon-button customer-icon-aqua"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => handleDelete(ben.id)}
                  className="customer-icon-button customer-icon-danger"
                >
                  <Trash2 size={16} />
                </button>

              </div>

            </div>

            <div className="customer-beneficiary-footer">

              <Badge
                text={ben.verification_status}
                color={getStatusBadgeColor(
                  ben.verification_status
                )}
              />

              <Badge
                text={ben.status}
                color={getStatusBadgeColor(ben.status)}
              />

              <span className="customer-small-text">
                Max:{' '}
                {formatCurrency(
                  Number(ben.max_transfer_limit)
                )}
              </span>

            </div>

          </Card>
        ))}

        {beneficiaries.length === 0 && !showForm && (
          <EmptyState
            icon={<Users size={28} />}
            title="No beneficiaries"
            message="Add a beneficiary to start transferring funds."
          />
        )}

      </div>
    </div>
  );
}

function CardsView() {
  const { loggedInCustomer } = useAuth();

  const {
    data: cards,
    loading,
    setData
  } = useCustomerData<CardType>(
    'cards',
    loggedInCustomer!.id
  );

  const updateCardStatus = async (
    id: string,
    status: string
  ) => {
    await supabase
      .from('cards')
      .update({ status })
      .eq('id', id);

    setData(
      cards.map(c =>
        c.id === id
          ? { ...c, status }
          : c
      )
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="customer-section customer-stack-md">

      <h3 className="customer-page-heading">
        Card Management
      </h3>

      <div className="customer-two-column-grid customer-card-grid">

        {cards.map((card) => (
          <div key={card.id}>

            <div
              className={
                card.card_type === 'Credit'
                  ? 'customer-bank-card customer-credit-card'
                  : 'customer-bank-card customer-debit-card'
              }
            >

              <div className="customer-bank-card-header">

                <div>
                  <p className="customer-card-overline">
                    {card.card_type} Card
                  </p>

                  <p className="customer-bank-name">
                    {BANK_INFO.name}
                  </p>
                </div>

                <div className="customer-card-network">
                  {card.card_network}
                </div>

              </div>

              <div className="customer-card-chip" />

              <p className="customer-card-number">
                {maskCardNumber(card.card_number)}
              </p>

              <div className="customer-bank-card-footer">

                <div>
                  <p className="customer-card-overline">
                    Expiry
                  </p>

                  <p className="customer-card-value">
                    {card.expiry}
                  </p>
                </div>

                <div className="customer-align-right">
                  <p className="customer-card-overline">
                    Status
                  </p>

                  <p className="customer-card-value">
                    {card.status}
                  </p>
                </div>

              </div>

            </div>

            <Card className="customer-card-padding-sm customer-card-controls">

              <div className="customer-two-column-small">

                <div>
                  <p className="customer-label">
                    Daily Limit
                  </p>

                  <p className="customer-value">
                    {formatCurrency(
                      Number(card.daily_limit)
                    )}
                  </p>
                </div>

                <div>
                  <p className="customer-label">
                    Available Limit
                  </p>

                  <p className="customer-value customer-teal-text">
                    {formatCurrency(
                      Number(card.available_limit)
                    )}
                  </p>
                </div>

              </div>

              <div className="customer-button-wrap">

                {card.status === 'Active' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() =>
                        updateCardStatus(
                          card.id,
                          'Blocked'
                        )
                      }
                    >
                      Block
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        updateCardStatus(
                          card.id,
                          'Frozen'
                        )
                      }
                    >
                      Freeze
                    </Button>
                  </>
                )}

                {card.status === 'Blocked' && (
                  <Button
                    onClick={() =>
                      updateCardStatus(
                        card.id,
                        'Active'
                      )
                    }
                  >
                    Unblock
                  </Button>
                )}

                {card.status === 'Frozen' && (
                  <Button
                    onClick={() =>
                      updateCardStatus(
                        card.id,
                        'Active'
                      )
                    }
                  >
                    Unfreeze
                  </Button>
                )}

                <Button variant="accent">
                  Replace Card
                </Button>

              </div>

            </Card>

          </div>
        ))}

        {cards.length === 0 && (
          <EmptyState
            icon={<CreditCard size={28} />}
            title="No cards"
            message="You do not have any cards linked to your account."
          />
        )}

      </div>
    </div>
  );
}

function LoansView() {
  const { loggedInCustomer } = useAuth();

  const {
    data: loans,
    loading,
    setData
  } = useCustomerData<Loan>(
    'loans',
    loggedInCustomer!.id
  );

  const [showCalculator, setShowCalculator] =
    useState(false);

  const [showApplication, setShowApplication] =
    useState(false);

  const [calc, setCalc] = useState({
    principal: '500000',
    rate: '10.5',
    tenure: '60'
  });

  const [appForm, setAppForm] = useState({
    type: 'Personal',
    amount: '',
    tenure: '12',
    employment: 'Salaried',
    income: ''
  });

  const calcEmi = () => {
    const p = Number(calc.principal);
    const r = Number(calc.rate) / 12 / 100;
    const n = Number(calc.tenure);

    if (r === 0) return p / n;

    return (
      p *
      r *
      Math.pow(1 + r, n) /
      (Math.pow(1 + r, n) - 1)
    );
  };

  const totalPayment =
    calcEmi() * Number(calc.tenure);

  const totalInterest =
    totalPayment - Number(calc.principal);

  const handleApply = async () => {
    if (
      !appForm.amount ||
      Number(appForm.amount) <= 0
    ) {
      return;
    }

    const loanId =
      'LOAN-' +
      loggedInCustomer!.customer_id +
      '-' +
      Date.now().toString().slice(-4);

    const { data: newLoan } =
      await supabase
        .from('loans')
        .insert({
          loan_id: loanId,
          customer_id: loggedInCustomer!.id,
          loan_type: appForm.type,
          loan_amount: Number(appForm.amount),
          interest_rate: 10.5,
          tenure_months: Number(appForm.tenure),
          outstanding_amount: Number(appForm.amount),
          emi_amount: 0,
          status: 'Submitted',
          employment_type: appForm.employment,
          monthly_income:
            Number(appForm.income) || 0,
        })
        .select('*');

    if (newLoan) {
      setData([
        newLoan[0] as Loan,
        ...loans
      ]);
    }

    setShowApplication(false);

    setAppForm({
      type: 'Personal',
      amount: '',
      tenure: '12',
      employment: 'Salaried',
      income: ''
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="customer-section customer-stack-lg">

      <div className="customer-toolbar">

        <h3 className="customer-page-heading">
          Loan Management
        </h3>

        <div className="customer-button-row">

          <Button
            variant="secondary"
            onClick={() =>
              setShowCalculator(!showCalculator)
            }
          >
            <span className="customer-inline">
              <Calculator size={16} />
              EMI Calculator
            </span>
          </Button>

          <Button
            onClick={() =>
              setShowApplication(!showApplication)
            }
          >
            <span className="customer-inline">
              <Plus size={16} />
              Apply for Loan
            </span>
          </Button>

        </div>

      </div>

      {showCalculator && (
        <Card className="customer-card-padding-lg">

          <h4 className="customer-subtitle customer-margin-bottom">
            EMI Calculator
          </h4>

          <div className="customer-three-column-grid customer-margin-bottom">

            <Input
              label="Principal Amount"
              type="number"
              value={calc.principal}
              onChange={(v) =>
                setCalc({
                  ...calc,
                  principal: v
                })
              }
            />

            <Input
              label="Interest Rate (%)"
              type="number"
              value={calc.rate}
              onChange={(v) =>
                setCalc({
                  ...calc,
                  rate: v
                })
              }
            />

            <Input
              label="Tenure (months)"
              type="number"
              value={calc.tenure}
              onChange={(v) =>
                setCalc({
                  ...calc,
                  tenure: v
                })
              }
            />

          </div>

          <div className="customer-three-column-grid">

            <div className="customer-info-box customer-info-teal">
              <p className="customer-label">
                Monthly EMI
              </p>

              <p className="customer-large-value customer-teal-text">
                {formatCurrency(calcEmi())}
              </p>
            </div>

            <div className="customer-info-box customer-info-white">
              <p className="customer-label">
                Total Interest
              </p>

              <p className="customer-large-value">
                {formatCurrency(totalInterest)}
              </p>
            </div>

            <div className="customer-info-box customer-info-aqua">
              <p className="customer-label">
                Total Repayment
              </p>

              <p className="customer-large-value customer-aqua-text">
                {formatCurrency(totalPayment)}
              </p>
            </div>

          </div>

        </Card>
      )}

      {showApplication && (
        <Card className="customer-card-padding-lg">

          <h4 className="customer-subtitle customer-margin-bottom">
            New Loan Application
          </h4>

          <div className="customer-two-column-grid">

            <Select
              label="Loan Type"
              value={appForm.type}
              onChange={(v) =>
                setAppForm({
                  ...appForm,
                  type: v
                })
              }
              options={[
                'Personal',
                'Home',
                'Vehicle',
                'Education'
              ].map(t => ({
                value: t,
                label: t
              }))}
              required
            />

            <Input
              label="Loan Amount"
              type="number"
              value={appForm.amount}
              onChange={(v) =>
                setAppForm({
                  ...appForm,
                  amount: v
                })
              }
              placeholder="e.g. 500000"
              required
            />

            <Select
              label="Tenure (months)"
              value={appForm.tenure}
              onChange={(v) =>
                setAppForm({
                  ...appForm,
                  tenure: v
                })
              }
              options={[
                '12',
                '24',
                '36',
                '48',
                '60',
                '120',
                '180',
                '240'
              ].map(t => ({
                value: t,
                label: t + ' months'
              }))}
              required
            />

            <Select
              label="Employment Type"
              value={appForm.employment}
              onChange={(v) =>
                setAppForm({
                  ...appForm,
                  employment: v
                })
              }
              options={[
                'Salaried',
                'Self-Employed',
                'Business',
                'Student'
              ].map(t => ({
                value: t,
                label: t
              }))}
            />

            <Input
              label="Monthly Income"
              type="number"
              value={appForm.income}
              onChange={(v) =>
                setAppForm({
                  ...appForm,
                  income: v
                })
              }
              placeholder="e.g. 50000"
            />

          </div>

          <div className="customer-button-row customer-margin-top">

            <Button onClick={handleApply}>
              Submit Application
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                setShowApplication(false)
              }
            >
              Cancel
            </Button>

          </div>

        </Card>
      )}

      <div className="customer-two-column-grid">

        {loans.map((loan) => (
          <Card
            key={loan.id}
            className="customer-card-padding"
          >

            <div className="customer-account-header">

              <div>
                <h4 className="customer-card-heading">
                  {loan.loan_type} Loan
                </h4>

                <p className="customer-muted-mono">
                  {loan.loan_id}
                </p>
              </div>

              <Badge
                text={loan.status}
                color={getStatusBadgeColor(loan.status)}
              />

            </div>

            <div className="customer-detail-list customer-small-text-size">

              <Row
                label="Loan Amount"
                value={formatCurrency(
                  Number(loan.loan_amount)
                )}
              />

              <Row
                label="Outstanding"
                value={formatCurrency(
                  Number(loan.outstanding_amount)
                )}
                valueClass="customer-debit-text"
              />

              <Row
                label="Interest Rate"
                value={`${loan.interest_rate}%`}
              />

              <Row
                label="Tenure"
                value={`${loan.tenure_months} months`}
              />

              {loan.emi_amount > 0 && (
                <Row
                  label="Monthly EMI"
                  value={formatCurrency(
                    Number(loan.emi_amount)
                  )}
                  valueClass="customer-teal-text"
                />
              )}

              {loan.next_due_date && (
                <Row
                  label="Next Due"
                  value={formatDate(
                    loan.next_due_date
                  )}
                />
              )}

              <Row
                label="Remaining Tenure"
                value={`${loan.remaining_tenure} months`}
              />

            </div>

          </Card>
        ))}

        {loans.length === 0 &&
          !showApplication && (
            <EmptyState
              icon={<Landmark size={28} />}
              title="No loans"
              message="Apply for a loan to see it here."
            />
          )}

      </div>

    </div>
  );
}

function StatementsView() {
  const { loggedInCustomer } = useAuth();

  const { data: accounts } =
    useCustomerData<Account>(
      'accounts',
      loggedInCustomer!.id
    );

  const { data: transactions } =
    useCustomerData<Transaction>(
      'transactions',
      loggedInCustomer!.id
    );

  const [selectedAccount, setSelectedAccount] =
    useState('');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [generated, setGenerated] = useState(false);
  const [page, setPage] = useState(1);

  const pageSize = 20;

  const filteredTx = transactions.filter((tx) => {
    if (
      selectedAccount &&
      tx.account_id !== selectedAccount
    ) {
      return false;
    }

    if (
      fromDate &&
      new Date(tx.transaction_date) <
      new Date(fromDate)
    ) {
      return false;
    }

    if (
      toDate &&
      new Date(tx.transaction_date) >
      new Date(toDate + 'T23:59:59')
    ) {
      return false;
    }

    return true;
  });

  let runningBalance =
    accounts.find(
      a => a.id === selectedAccount
    )?.available_balance || 0;

  const sortedTx = [...filteredTx].sort(
    (a, b) =>
      new Date(b.transaction_date).getTime() -
      new Date(a.transaction_date).getTime()
  );

  const totalPages =
    Math.ceil(sortedTx.length / pageSize);

  const paged = sortedTx.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="customer-section customer-stack-md">

      <h3 className="customer-page-heading">
        Bank Statements
      </h3>

      <Card className="customer-card-padding">

        <div className="customer-three-column-grid">

          <Select
            label="Account"
            value={selectedAccount}
            onChange={setSelectedAccount}
            options={accounts.map(a => ({
              value: a.id,
              label: `${a.account_type} - ${maskAccountNumber(a.account_number)}`
            }))}
            required
          />

          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={setFromDate}
          />

          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={setToDate}
          />

        </div>

        <div className="customer-button-row customer-margin-top">

          <Button
            onClick={() => {
              setGenerated(true);
              setPage(1);
            }}
          >
            Generate Statement
          </Button>

          {generated && (
            <Button
              variant="accent"
              onClick={() => window.print()}
            >
              <span className="customer-inline">
                <Download size={16} />
                Download/Print
              </span>
            </Button>
          )}

        </div>

      </Card>

      {generated && (
        <Card className="customer-table-card">

          <div className="customer-statement-header">

            <h4>Account Statement</h4>

            <p>
              {accounts.find(
                a => a.id === selectedAccount
              )?.account_type || 'All Accounts'}
              {' · '}
              {fromDate
                ? ` ${formatDate(fromDate)}`
                : ' Start'}
              {' to '}
              {toDate
                ? formatDate(toDate)
                : ' Today'}
            </p>

          </div>

          <div className="customer-table-wrapper">

            <table className="customer-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="customer-align-right">
                    Debit
                  </th>
                  <th className="customer-align-right">
                    Credit
                  </th>
                  <th className="customer-align-right">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody>

                {paged.map((tx) => {

                  const isDebit =
                    tx.debit_credit === 'Debit';

                  runningBalance =
                    Number(tx.balance_after) ||
                    runningBalance;

                  return (
                    <tr key={tx.id}>

                      <td>
                        {formatDate(
                          tx.transaction_date
                        )}
                      </td>

                      <td>
                        {tx.merchant || tx.type}
                        {' ('}
                        {tx.channel}
                        {')'}
                      </td>

                      <td className="customer-align-right customer-debit-text">
                        {isDebit
                          ? formatCurrency(
                              Number(tx.amount)
                            )
                          : '-'}
                      </td>

                      <td className="customer-align-right customer-credit-text">
                        {!isDebit
                          ? formatCurrency(
                              Number(tx.amount)
                            )
                          : '-'}
                      </td>

                      <td className="customer-align-right customer-value">
                        {formatCurrency(
                          Number(tx.balance_after) || 0
                        )}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

          {paged.length === 0 && (
            <EmptyState
              icon={<FileText size={28} />}
              title="No transactions"
              message="No transactions found for the selected period."
            />
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />

        </Card>
      )}

    </div>
  );
}

function ServiceRequestsView() {
  const { loggedInCustomer } = useAuth();

  const {
    data: requests,
    loading,
    setData
  } = useCustomerData<ServiceRequest>(
    'service_requests',
    loggedInCustomer!.id
  );

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] = useState({
    type: 'Account Issue',
    subject: '',
    description: '',
    priority: 'Medium'
  });

  const handleSubmit = async () => {
    if (!form.subject) return;

    const ticketId =
      'SR-' +
      loggedInCustomer!.customer_id +
      '-' +
      Date.now().toString().slice(-4);

    const { data: newReq } =
      await supabase
        .from('service_requests')
        .insert({
          ticket_id: ticketId,
          customer_id: loggedInCustomer!.id,
          request_type: form.type,
          subject: form.subject,
          description: form.description,
          status: 'Created',
          priority: form.priority,
        })
        .select('*');

    if (newReq) {
      setData([
        newReq[0] as ServiceRequest,
        ...requests
      ]);
    }

    setShowForm(false);

    setForm({
      type: 'Account Issue',
      subject: '',
      description: '',
      priority: 'Medium'
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="customer-section customer-stack-md">

      <div className="customer-toolbar">

        <h3 className="customer-page-heading">
          Service Requests
        </h3>

        <Button
          onClick={() => setShowForm(!showForm)}
        >
          <span className="customer-inline">
            <Plus size={16} />
            New Request
          </span>
        </Button>

      </div>

      {showForm && (
        <Card className="customer-card-padding">

          <h4 className="customer-subtitle customer-margin-bottom">
            Raise New Service Request
          </h4>

          <div className="customer-two-column-grid">

            <Select
              label="Request Type"
              value={form.type}
              onChange={(v) =>
                setForm({
                  ...form,
                  type: v
                })
              }
              options={[
                'Account Issue',
                'Card Issue',
                'Transaction Dispute',
                'Address Update',
                'KYC Update',
                'Cheque Request',
                'Statement Request',
                'Other'
              ].map(t => ({
                value: t,
                label: t
              }))}
              required
            />

            <Select
              label="Priority"
              value={form.priority}
              onChange={(v) =>
                setForm({
                  ...form,
                  priority: v
                })
              }
              options={[
                'Low',
                'Medium',
                'High'
              ].map(t => ({
                value: t,
                label: t
              }))}
            />

          </div>

          <div className="customer-margin-top">

            <Input
              label="Subject"
              value={form.subject}
              onChange={(v) =>
                setForm({
                  ...form,
                  subject: v
                })
              }
              placeholder="Brief subject"
              required
            />

          </div>

          <div className="customer-margin-top">

            <label className="customer-form-label">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
              placeholder="Describe your issue..."
              rows={4}
              className="customer-textarea"
            />

          </div>

          <div className="customer-button-row customer-margin-top">

            <Button onClick={handleSubmit}>
              Submit Request
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>

          </div>

        </Card>
      )}

      <div className="customer-stack-sm">

        {requests.map((req) => (
          <Card
            key={req.id}
            className="customer-card-padding"
          >

            <div className="customer-request-header">

              <div>

                <div className="customer-request-title-row">

                  <h4 className="customer-card-heading">
                    {req.subject}
                  </h4>

                  <Badge
                    text={req.priority}
                    color={
                      req.priority === 'High'
                        ? 'red'
                        : req.priority === 'Medium'
                          ? 'yellow'
                          : 'gray'
                    }
                  />

                </div>

                <p className="customer-muted-mono">
                  {req.ticket_id}
                  {' · '}
                  {formatDate(req.created_at)}
                </p>

              </div>

              <Badge
                text={req.status}
                color={getStatusBadgeColor(req.status)}
              />

            </div>

            <p className="customer-description">
              {req.description}
            </p>

            <p className="customer-muted-text customer-small-margin">
              Type: {req.request_type}
              {' · '}
              Assigned to: {req.assigned_to || 'Unassigned'}
            </p>

          </Card>
        ))}

        {requests.length === 0 && !showForm && (
          <EmptyState
            icon={<Settings size={28} />}
            title="No service requests"
            message="Raise a request to get help from our team."
          />
        )}

      </div>

    </div>
  );
}

function NotificationsView() {
  const { loggedInCustomer } = useAuth();

  const {
    data: notifications,
    loading,
    setData
  } = useCustomerData<Notification>(
    'notifications',
    loggedInCustomer!.id
  );

  const [filter, setFilter] =
    useState('');

  const filtered = filter
    ? notifications.filter(
        n => n.category === filter
      )
    : notifications;

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setData(
      notifications.map(n =>
        n.id === id
          ? { ...n, is_read: true }
          : n
      )
    );
  };

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq(
        'customer_id',
        loggedInCustomer!.id
      )
      .eq('is_read', false);

    setData(
      notifications.map(n => ({
        ...n,
        is_read: true
      }))
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="customer-section customer-stack-md">

      <div className="customer-toolbar">

        <h3 className="customer-page-heading">
          Notifications
        </h3>

        <div className="customer-button-row">

          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
            className="customer-select"
          >
            <option value="">
              All Categories
            </option>

            <option value="Login">
              Login
            </option>

            <option value="Transfer">
              Transfer
            </option>

            <option value="Card Transaction">
              Card Transaction
            </option>

            <option value="Loan Status">
              Loan Status
            </option>

            <option value="KYC">
              KYC
            </option>

            <option value="Fraud Alert">
              Fraud Alert
            </option>
          </select>

          <Button
            variant="secondary"
            onClick={markAllRead}
          >
            Mark All Read
          </Button>

        </div>

      </div>

      <div className="customer-stack-sm">

        {filtered.map((notif) => (
          <Card
            key={notif.id}
            className={
              !notif.is_read
                ? 'customer-card-padding customer-notification-unread'
                : 'customer-card-padding'
            }
          >

            <div className="customer-notification-content">

              <div className="customer-notification-main">

                <div className="customer-request-title-row">

                  <h4 className="customer-card-heading customer-small-heading">
                    {notif.title}
                  </h4>

                  {!notif.is_read && (
                    <span className="customer-notification-dot" />
                  )}

                </div>

                <p className="customer-description">
                  {notif.message}
                </p>

                <p className="customer-muted-text customer-small-margin">
                  {formatDateTime(notif.created_at)}
                  {' · '}
                  {notif.category}
                </p>

              </div>

              {!notif.is_read && (
                <button
                  onClick={() =>
                    markAsRead(notif.id)
                  }
                  className="customer-link-button"
                >
                  Mark as read
                </button>
              )}

            </div>

          </Card>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon={<Bell size={28} />}
            title="No notifications"
            message="You are all caught up!"
          />
        )}

      </div>

    </div>
  );
}

function LocatorView() {
  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  useEffect(() => {
    supabase
      .from('branches')
      .select('*')
      .then(({ data }) => {
        setBranches(
          (data || []) as Branch[]
        );

        setLoading(false);
      });
  }, []);

  const filtered = branches.filter(b =>
    b.city
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    b.branch_name
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    b.branch_code
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="customer-section customer-stack-md">

      <h3 className="customer-page-heading">
        Branch & ATM Locator
      </h3>

      <div className="customer-search-wrapper">

        <Search
          className="customer-search-icon"
          size={18}
        />

        <input
          type="text"
          placeholder="Search by city, branch name, or code..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="customer-search-input"
        />

      </div>

      <div className="customer-two-column-grid">

        {filtered.map((branch) => (
          <Card
            key={branch.id}
            className="customer-card-padding"
          >

            <div className="customer-account-header">

              <div>

                <h4 className="customer-card-heading">
                  {branch.branch_name}
                </h4>

                <p className="customer-muted-mono">
                  {branch.branch_code}
                </p>

              </div>

              <Badge
                text="Open"
                color="green"
              />

            </div>

            <div className="customer-detail-list customer-small-text-size">

              <p className="customer-description">
                <span className="customer-label-inline">
                  Address:
                </span>
                {' '}
                {branch.address}
              </p>

              <p className="customer-description">
                <span className="customer-label-inline">
                  Phone:
                </span>
                {' '}
                {branch.phone}
              </p>

              <p className="customer-description">
                <span className="customer-label-inline">
                  Hours:
                </span>
                {' '}
                {branch.working_hours}
              </p>

              <div>

                <p className="customer-label customer-service-label">
                  Services:
                </p>

                <div className="customer-service-list">

                  {branch.services.map((s) => (
                    <span
                      key={s}
                      className="customer-service-chip"
                    >
                      {s}
                    </span>
                  ))}

                </div>

              </div>

            </div>

          </Card>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon={<Phone size={28} />}
            title="No branches found"
            message="Try a different search term."
          />
        )}

      </div>

    </div>
  );
}

function Row({
  label,
  value,
  highlight = false,
  valueClass = ''
}: {
  label: string;
  value: string;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="customer-detail-row">

      <span className="customer-label">
        {label}
      </span>

      <span
        className={
          highlight
            ? `customer-value customer-teal-text ${valueClass}`
            : `customer-value ${valueClass}`
        }
      >
        {value}
      </span>

    </div>
  );
}