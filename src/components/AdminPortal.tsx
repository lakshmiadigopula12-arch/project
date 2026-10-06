import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  AlertTriangle,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  FileText,
  Shield,
  UserCheck,
  Activity,
  Settings,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { PortalLayout, NavItem } from '@/components/PortalLayout';
import {
  Card,
  StatCard,
  Badge,
  LoadingSpinner,
  EmptyState,
  getStatusBadgeColor,
} from '@/components/ui';
import { SupportWidget } from '@/components/SupportWidget';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/constants';
import type {
  Customer,
  Employee,
  Branch,
  Transaction,
  Loan,
  FraudAlert,
} from '@/lib/types';

import './AdminPortal.css';

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Executive Dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: <Users size={18} />,
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: <UserCheck size={18} />,
  },
  {
    id: 'branches',
    label: 'Branches',
    icon: <Building2 size={18} />,
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: <Activity size={18} />,
  },
  {
    id: 'fraud',
    label: 'Fraud Operations',
    icon: <AlertTriangle size={18} />,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <FileText size={18} />,
  },
];

export function AdminPortal() {
  const { loggedInEmployee } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (!loggedInEmployee) return null;

  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userName={loggedInEmployee.full_name}
      userRole={loggedInEmployee.role}
      portalName="Admin Portal"
      accentColor="#006D77"
    >
      <div className="admin-portal">
        {activeSection === 'dashboard' && <AdminDashboard />}
        {activeSection === 'customers' && <AdminCustomers />}
        {activeSection === 'employees' && <AdminEmployees />}
        {activeSection === 'branches' && <AdminBranches />}
        {activeSection === 'transactions' && <AdminTransactions />}
        {activeSection === 'fraud' && <AdminFraud />}
        {activeSection === 'reports' && <AdminReports />}

        <SupportWidget />
      </div>
    </PortalLayout>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    accounts: 0,
    transactions: 0,
    txVolume: 0,
    loans: 0,
    loanAmount: 0,
    pendingKyc: 0,
    fraudAlerts: 0,
    openDisputes: 0,
    employees: 0,
  });

  const [txByType, setTxByType] = useState<Record<string, number>>({});
  const [txByStatus, setTxByStatus] = useState<Record<string, number>>({});
  const [txByChannel, setTxByChannel] = useState<Record<string, number>>({});
  const [riskDistribution, setRiskDistribution] = useState({
    low: 0,
    medium: 0,
    high: 0,
  });

  const [timeFilter, setTimeFilter] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        { count: customers },
        { count: accounts },
        { count: txCount },
        { data: txData },
        { count: loans },
        { data: loanData },
        { count: pendingKyc },
        { count: fraud },
        { count: disputes },
        { count: employees },
      ] = await Promise.all([
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('accounts')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('transactions')
          .select('type,amount,debit_credit,status,channel'),

        supabase
          .from('loans')
          .select('*', { count: 'exact', head: true }),

        supabase.from('loans').select('loan_amount'),

        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('kyc_status', 'Pending'),

        supabase
          .from('fraud_alerts')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Open', 'Under Investigation']),

        supabase
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Created', 'In Progress']),

        supabase
          .from('employees')
          .select('*', { count: 'exact', head: true }),
      ]);

      const txList = (txData || []) as Transaction[];
      const loanList = (loanData || []) as Loan[];

      const totalTxVolume = txList.reduce(
        (s, t) => s + Number(t.amount),
        0
      );

      const totalLoanAmount = loanList.reduce(
        (s, l) => s + Number(l.loan_amount),
        0
      );

      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byChannel: Record<string, number> = {};

      txList.forEach((t) => {
        byType[t.type] = (byType[t.type] || 0) + 1;
        byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        byChannel[t.channel] = (byChannel[t.channel] || 0) + 1;
      });

      setStats({
        customers: customers || 0,
        accounts: accounts || 0,
        transactions: txCount || 0,
        txVolume: totalTxVolume,
        loans: loans || 0,
        loanAmount: totalLoanAmount,
        pendingKyc: pendingKyc || 0,
        fraudAlerts: fraud || 0,
        openDisputes: disputes || 0,
        employees: employees || 0,
      });

      setTxByType(byType);
      setTxByStatus(byStatus);
      setTxByChannel(byChannel);

      setLoading(false);

      const { data: custData } = await supabase
        .from('customers')
        .select('risk_category');

      const custList = (custData || []) as Customer[];

      setRiskDistribution({
        low: custList.filter((c) => c.risk_category === 'Low').length,
        medium: custList.filter((c) => c.risk_category === 'Medium').length,
        high: custList.filter((c) => c.risk_category === 'High').length,
      });
    })();
  }, [timeFilter]);

  if (loading) return <LoadingSpinner />;

  const totalCustForRisk =
    riskDistribution.low +
      riskDistribution.medium +
      riskDistribution.high || 1;

  return (
    <div className="admin-page admin-dashboard">
      <section className="admin-hero">
        <div className="admin-hero-content">
          <h2>Executive Banking Dashboard</h2>

          <p>
            Real-time overview of banking operations and performance
          </p>

          <div className="admin-time-filter">
            {['Today', '7', '30', '180', '365'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeFilter(t)}
                className={
                  timeFilter === t
                    ? 'admin-time-button active'
                    : 'admin-time-button'
                }
              >
                {t === 'Today'
                  ? 'Today'
                  : t === '7'
                    ? '7 Days'
                    : t === '30'
                      ? '30 Days'
                      : t === '180'
                        ? '6 Months'
                        : '1 Year'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-stat-grid">
        <StatCard
          label="Total Customers"
          value={stats.customers.toLocaleString()}
          icon={<Users size={22} />}
          color="#006D77"
        />

        <StatCard
          label="Active Accounts"
          value={stats.accounts.toLocaleString()}
          icon={<Wallet size={22} />}
          color="#00B4D8"
        />

        <StatCard
          label="Total Transactions"
          value={stats.transactions.toLocaleString()}
          icon={<Activity size={22} />}
          color="#83C5BE"
        />

        <StatCard
          label="Transaction Volume"
          value={formatCurrency(stats.txVolume)}
          icon={<TrendingUp size={22} />}
          color="#006D77"
        />

        <StatCard
          label="Total Loans"
          value={stats.loans.toLocaleString()}
          icon={<CreditCard size={22} />}
          color="#00B4D8"
        />

        <StatCard
          label="Loan Amount"
          value={formatCurrency(stats.loanAmount)}
          icon={<FileText size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Pending KYC"
          value={String(stats.pendingKyc)}
          icon={<Shield size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Fraud Alerts"
          value={String(stats.fraudAlerts)}
          icon={<AlertTriangle size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Open Disputes"
          value={String(stats.openDisputes)}
          icon={<Settings size={22} />}
          color="#00B4D8"
        />

        <StatCard
          label="Employees"
          value={String(stats.employees)}
          icon={<UserCheck size={22} />}
          color="#006D77"
        />
      </section>

      <section className="admin-analytics-grid">
        <Card className="admin-analytics-card">
          <h3>Transactions by Type</h3>

          <div className="admin-bar-list">
            {Object.entries(txByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const max = Math.max(
                  ...Object.values(txByType)
                );

                return (
                  <div
                    key={type}
                    className="admin-bar-item"
                  >
                    <div className="admin-bar-label">
                      <span>{type}</span>
                      <strong>{count}</strong>
                    </div>

                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill teal"
                        style={{
                          width: `${(count / max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card className="admin-analytics-card">
          <h3>Transactions by Status</h3>

          <div className="admin-status-chart">
            {Object.entries(txByStatus).map(
              ([status, count]) => {
                const total =
                  Object.values(txByStatus).reduce(
                    (a, b) => a + b,
                    0
                  ) || 1;

                const colors: Record<string, string> = {
                  Success: '#006D77',
                  Pending: '#FF8A80',
                  Failed: '#FF8A80',
                  Reversed: '#00B4D8',
                  'Under Review': '#83C5BE',
                };

                return (
                  <div
                    key={status}
                    className="admin-status-item"
                  >
                    <div className="admin-status-ring">
                      <svg viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#83C5BE"
                          strokeOpacity="0.25"
                          strokeWidth="10"
                        />

                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={
                            colors[status] || '#83C5BE'
                          }
                          strokeWidth="10"
                          strokeDasharray={`${(count / total) * 251} 251`}
                          strokeLinecap="round"
                        />
                      </svg>

                      <div className="admin-status-value">
                        {count}
                      </div>
                    </div>

                    <p>{status}</p>
                  </div>
                );
              }
            )}
          </div>
        </Card>

        <Card className="admin-analytics-card">
          <h3>Transactions by Channel</h3>

          <div className="admin-bar-list">
            {Object.entries(txByChannel)
              .sort((a, b) => b[1] - a[1])
              .map(([channel, count]) => {
                const max = Math.max(
                  ...Object.values(txByChannel)
                );

                const colors = [
                  '#006D77',
                  '#00B4D8',
                  '#83C5BE',
                  '#FF8A80',
                ];

                const idx =
                  Object.keys(txByChannel).indexOf(channel);

                return (
                  <div
                    key={channel}
                    className="admin-bar-item"
                  >
                    <div className="admin-bar-label">
                      <span>{channel}</span>
                      <strong>{count}</strong>
                    </div>

                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{
                          width: `${(count / max) * 100}%`,
                          backgroundColor:
                            colors[idx % colors.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card className="admin-analytics-card">
          <h3>Customer Risk Distribution</h3>

          <div className="admin-risk-chart">
            {[
              {
                label: 'Low Risk',
                count: riskDistribution.low,
                color: '#006D77',
              },
              {
                label: 'Medium Risk',
                count: riskDistribution.medium,
                color: '#FF8A80',
              },
              {
                label: 'High Risk',
                count: riskDistribution.high,
                color: '#00B4D8',
              },
            ].map((item) => {
              const max = Math.max(
                riskDistribution.low,
                riskDistribution.medium,
                riskDistribution.high,
                1
              );

              const heightPct =
                (item.count / max) * 100;

              return (
                <div
                  key={item.label}
                  className="admin-risk-item"
                >
                  <span className="admin-risk-count">
                    {item.count}
                  </span>

                  <div className="admin-risk-bar-area">
                    <div
                      className="admin-risk-bar"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  <span className="admin-risk-label">
                    {item.label}
                  </span>

                  <span className="admin-risk-percent">
                    {(
                      (item.count / totalCustForRisk) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}

function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setCustomers((data || []) as Customer[]);
        setLoading(false);
      });
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.full_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      c.customer_id
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page admin-section">
      <h3 className="admin-section-title">
        Customer Management
      </h3>

      <div className="admin-search-wrapper">
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
      </div>

      <Card className="admin-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>City</th>
                <th>Risk Score</th>
                <th className="center">KYC</th>
                <th className="center">Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="mono">
                    {c.customer_id}
                  </td>

                  <td className="primary-text">
                    {c.full_name}
                  </td>

                  <td>{c.city}</td>

                  <td>
                    <span
                      className={
                        c.risk_score >= 70
                          ? 'risk-high'
                          : c.risk_score >= 40
                            ? 'risk-medium'
                            : 'risk-low'
                      }
                    >
                      {c.risk_score}/100
                    </span>
                  </td>

                  <td className="center">
                    <Badge
                      text={c.kyc_status}
                      color={getStatusBadgeColor(
                        c.kyc_status
                      )}
                    />
                  </td>

                  <td className="center">
                    <Badge
                      text={c.account_status}
                      color={getStatusBadgeColor(
                        c.account_status
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={<Users size={28} />}
            title="No customers"
            message="No customers found."
          />
        )}
      </Card>
    </div>
  );
}

function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('employees')
      .select('*,branches(branch_name)')
      .then(({ data }) => {
        setEmployees(
          (data || []) as unknown as Employee[]
        );
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page admin-section">
      <h3 className="admin-section-title">
        Employee Management
      </h3>

      <div className="admin-card-grid">
        {employees.map((emp) => (
          <Card
            key={emp.id}
            className="admin-person-card"
          >
            <div className="admin-person-header">
              <div className="admin-person-info">
                <div className="admin-avatar">
                  {emp.full_name.charAt(0)}
                </div>

                <div>
                  <h4>{emp.full_name}</h4>
                  <p className="admin-code">
                    {emp.employee_id}
                  </p>
                </div>
              </div>

              <Badge
                text={emp.status}
                color={getStatusBadgeColor(emp.status)}
              />
            </div>

            <div className="admin-detail-list">
              <p>
                <span>Role:</span> {emp.role}
              </p>

              <p>
                <span>Dept:</span> {emp.department}
              </p>

              <p>
                <span>Email:</span> {emp.email}
              </p>

              <p>
                <span>Mobile:</span> {emp.mobile}
              </p>
            </div>
          </Card>
        ))}

        {employees.length === 0 && (
          <EmptyState
            icon={<UserCheck size={28} />}
            title="No employees"
            message="No employees found."
          />
        )}
      </div>
    </div>
  );
}

function AdminBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('branches')
      .select('*')
      .then(({ data }) => {
        setBranches((data || []) as Branch[]);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page admin-section">
      <h3 className="admin-section-title">
        Branch Management
      </h3>

      <div className="admin-card-grid">
        {branches.map((branch) => (
          <Card
            key={branch.id}
            className="admin-person-card"
          >
            <div className="admin-person-header">
              <div>
                <h4>{branch.branch_name}</h4>

                <p className="admin-code">
                  {branch.branch_code}
                </p>
              </div>

              <Badge text="Open" color="green" />
            </div>

            <div className="admin-detail-list">
              <p>
                <span>City:</span> {branch.city}
              </p>

              <p>
                <span>Address:</span> {branch.address}
              </p>

              <p>
                <span>Phone:</span> {branch.phone}
              </p>

              <p>
                <span>Hours:</span>{' '}
                {branch.working_hours}
              </p>

              <div className="admin-service-list">
                {branch.services.map((s) => (
                  <span
                    key={s}
                    className="admin-service-tag"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {branches.length === 0 && (
          <EmptyState
            icon={<Building2 size={28} />}
            title="No branches"
            message="No branches found."
          />
        )}
      </div>
    </div>
  );
}

function AdminTransactions() {
  const [transactions, setTransactions] = useState<
    Transaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setTransactions(
          (data || []) as Transaction[]
        );
        setLoading(false);
      });
  }, []);

  const filtered = transactions.filter(
    (t) =>
      t.transaction_id
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      t.merchant
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      t.type
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page admin-section">
      <h3 className="admin-section-title">
        All Transactions
      </h3>

      <div className="admin-search-wrapper">
        <input
          type="text"
          placeholder="Search by transaction ID, merchant, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
      </div>

      <Card className="admin-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Type</th>
                <th className="right">Amount</th>
                <th>Channel</th>
                <th className="center">Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.slice(0, 30).map((tx) => (
                <tr key={tx.id}>
                  <td className="mono">
                    {tx.transaction_id}
                  </td>

                  <td>
                    {formatDate(tx.transaction_date)}
                  </td>

                  <td className="primary-text">
                    {tx.type}
                  </td>

                  <td className="right">
                    <span
                      className={
                        tx.debit_credit === 'Credit'
                          ? 'amount-credit'
                          : 'amount-debit'
                      }
                    >
                      {tx.debit_credit === 'Credit'
                        ? '+'
                        : '-'}
                      {formatCurrency(
                        Number(tx.amount)
                      )}
                    </span>
                  </td>

                  <td>{tx.channel}</td>

                  <td className="center">
                    <Badge
                      text={tx.status}
                      color={getStatusBadgeColor(
                        tx.status
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={<Activity size={28} />}
            title="No transactions"
            message="No transactions found."
          />
        )}
      </Card>
    </div>
  );
}

function AdminFraud() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    supabase
      .from('fraud_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAlerts((data || []) as FraudAlert[]);
        setLoading(false);
      });
  }, []);

  const filtered = filter
    ? alerts.filter((a) => a.status === filter)
    : alerts;

  const totalLoss = filtered
    .filter((a) => a.status === 'Open')
    .reduce((s, a) => s + Number(a.amount), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page admin-section">
      <h3 className="admin-section-title">
        Fraud Operations Center
      </h3>

      <div className="admin-fraud-summary">
        <StatCard
          label="Total Alerts"
          value={String(alerts.length)}
          icon={<AlertTriangle size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Open Alerts"
          value={String(
            alerts.filter(
              (a) => a.status === 'Open'
            ).length
          )}
          icon={<AlertTriangle size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Under Investigation"
          value={String(
            alerts.filter(
              (a) => a.status === 'Under Investigation'
            ).length
          )}
          icon={<Shield size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Potential Loss"
          value={formatCurrency(totalLoss)}
          icon={<TrendingDown size={22} />}
          color="#FF8A80"
        />
      </div>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="admin-select"
      >
        <option value="">All Statuses</option>
        <option value="Open">Open</option>
        <option value="Under Investigation">
          Under Investigation
        </option>
        <option value="Closed">Closed</option>
      </select>

      <div className="admin-fraud-list">
        {filtered.map((alert) => {
          const riskClass =
            alert.risk_score >= 75
              ? 'high'
              : alert.risk_score >= 50
                ? 'medium'
                : 'low';

          return (
            <Card
              key={alert.id}
              className={`admin-fraud-card ${riskClass}`}
            >
              <div className="admin-fraud-content">
                <div className="admin-fraud-info">
                  <div
                    className={`admin-fraud-icon ${riskClass}`}
                  >
                    <AlertTriangle size={20} />
                  </div>

                  <div>
                    <p className="admin-fraud-title">
                      {alert.alert_type}
                    </p>

                    <p className="admin-fraud-meta">
                      {alert.alert_id} ·{' '}
                      {formatCurrency(
                        Number(alert.amount)
                      )}{' '}
                      · {alert.location}
                    </p>
                  </div>
                </div>

                <div className="admin-fraud-right">
                  <span
                    className={`admin-fraud-score ${riskClass}`}
                  >
                    {alert.risk_score}
                  </span>

                  <Badge
                    text={alert.status}
                    color={getStatusBadgeColor(
                      alert.status
                    )}
                  />
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState
            icon={<AlertTriangle size={28} />}
            title="No fraud alerts"
            message="No fraud alerts found."
          />
        )}
      </div>
    </div>
  );
}

function AdminReports() {
  const [loanStats, setLoanStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalAmount: 0,
  });

  const [txStats, setTxStats] = useState({
    total: 0,
    success: 0,
    pending: 0,
    failed: 0,
  });

  const [customerStats, setCustomerStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    highRisk: 0,
  });

  useEffect(() => {
    (async () => {
      const { data: loans } = await supabase
        .from('loans')
        .select('status,loan_amount');

      const loanList = (loans || []) as Loan[];

      setLoanStats({
        total: loanList.length,

        approved: loanList.filter(
          (l) =>
            l.status === 'Approved' ||
            l.status === 'Disbursed'
        ).length,

        pending: loanList.filter(
          (l) =>
            l.status === 'Submitted' ||
            l.status === 'Under Review'
        ).length,

        rejected: loanList.filter(
          (l) => l.status === 'Rejected'
        ).length,

        totalAmount: loanList.reduce(
          (s, l) => s + Number(l.loan_amount),
          0
        ),
      });

      const { data: txs } = await supabase
        .from('transactions')
        .select('status');

      const txList = (txs || []) as Transaction[];

      setTxStats({
        total: txList.length,

        success: txList.filter(
          (t) => t.status === 'Success'
        ).length,

        pending: txList.filter(
          (t) => t.status === 'Pending'
        ).length,

        failed: txList.filter(
          (t) => t.status === 'Failed'
        ).length,
      });

      const { data: custs } = await supabase
        .from('customers')
        .select('kyc_status,risk_category');

      const custList = (custs || []) as Customer[];

      setCustomerStats({
        total: custList.length,

        verified: custList.filter(
          (c) => c.kyc_status === 'Verified'
        ).length,

        pending: custList.filter(
          (c) =>
            c.kyc_status === 'Pending' ||
            c.kyc_status === 'Under Review'
        ).length,

        highRisk: custList.filter(
          (c) => c.risk_category === 'High'
        ).length,
      });
    })();
  }, []);

  return (
    <div className="admin-page admin-reports">
      <h3 className="admin-section-title">
        Reports & Analytics
      </h3>

      <div className="admin-report-grid">
        <Card className="admin-report-card">
          <h4>Loan Report</h4>

          <div className="admin-report-list">
            <ReportRow
              label="Total Loans"
              value={String(loanStats.total)}
            />

            <ReportRow
              label="Approved"
              value={String(loanStats.approved)}
              color="success"
            />

            <ReportRow
              label="Pending"
              value={String(loanStats.pending)}
              color="warning"
            />

            <ReportRow
              label="Rejected"
              value={String(loanStats.rejected)}
              color="danger"
            />

            <ReportRow
              label="Total Loan Amount"
              value={formatCurrency(
                loanStats.totalAmount
              )}
            />

            <ReportRow
              label="Approval Rate"
              value={`${
                loanStats.total
                  ? (
                      (loanStats.approved /
                        loanStats.total) *
                      100
                    ).toFixed(1)
                  : 0
              }%`}
            />
          </div>
        </Card>

        <Card className="admin-report-card">
          <h4>Transaction Report</h4>

          <div className="admin-report-list">
            <ReportRow
              label="Total Transactions"
              value={txStats.total.toLocaleString()}
            />

            <ReportRow
              label="Successful"
              value={String(txStats.success)}
              color="success"
            />

            <ReportRow
              label="Pending"
              value={String(txStats.pending)}
              color="warning"
            />

            <ReportRow
              label="Failed"
              value={String(txStats.failed)}
              color="danger"
            />

            <ReportRow
              label="Success Rate"
              value={`${
                txStats.total
                  ? (
                      (txStats.success /
                        txStats.total) *
                      100
                    ).toFixed(1)
                  : 0
              }%`}
              color="success"
            />
          </div>
        </Card>

        <Card className="admin-report-card">
          <h4>Customer Report</h4>

          <div className="admin-report-list">
            <ReportRow
              label="Total Customers"
              value={customerStats.total.toLocaleString()}
            />

            <ReportRow
              label="KYC Verified"
              value={String(
                customerStats.verified
              )}
              color="success"
            />

            <ReportRow
              label="KYC Pending"
              value={String(
                customerStats.pending
              )}
              color="warning"
            />

            <ReportRow
              label="High Risk"
              value={String(
                customerStats.highRisk
              )}
              color="danger"
            />

            <ReportRow
              label="Verification Rate"
              value={`${
                customerStats.total
                  ? (
                      (customerStats.verified /
                        customerStats.total) *
                      100
                    ).toFixed(1)
                  : 0
              }%`}
            />
          </div>
        </Card>
      </div>

      <Card className="admin-system-card">
        <h4>System Summary</h4>

        <div className="admin-summary-grid">
          <div className="admin-summary-item teal">
            <BarChart3 size={24} />

            <p className="admin-summary-value">
              {loanStats.total + txStats.total}
            </p>

            <p className="admin-summary-label">
              Total Records
            </p>
          </div>

          <div className="admin-summary-item mint">
            <Shield size={24} />

            <p className="admin-summary-value">
              {customerStats.total}
            </p>

            <p className="admin-summary-label">
              Customers
            </p>
          </div>

          <div className="admin-summary-item aqua">
            <Activity size={24} />

            <p className="admin-summary-value">
              {txStats.total}
            </p>

            <p className="admin-summary-label">
              Transactions
            </p>
          </div>

          <div className="admin-summary-item salmon">
            <AlertTriangle size={24} />

            <p className="admin-summary-value">
              {customerStats.highRisk}
            </p>

            <p className="admin-summary-label">
              High Risk
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ReportRow({
  label,
  value,
  color = 'default',
}: {
  label: string;
  value: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="admin-report-row">
      <span>{label}</span>

      <strong className={`report-value ${color}`}>
        {value}
      </strong>
    </div>
  );
}