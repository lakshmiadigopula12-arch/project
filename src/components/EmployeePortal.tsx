import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  AlertTriangle,
  Settings,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { PortalLayout, NavItem } from '@/components/PortalLayout';
import {
  Card,
  StatCard,
  Badge,
  LoadingSpinner,
  EmptyState,
  Button,
  getStatusBadgeColor,
} from '@/components/ui';
import { SupportWidget } from '@/components/SupportWidget';
import { supabase } from '@/lib/supabase';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/lib/constants';
import type {
  Customer,
  ServiceRequest,
  FraudAlert,
  Loan,
} from '@/lib/types';

import './EmployeePortal.css';

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'kyc',
    label: 'KYC Verification',
    icon: <Shield size={18} />,
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: <Users size={18} />,
  },
  {
    id: 'service',
    label: 'Service Requests',
    icon: <Settings size={18} />,
  },
  {
    id: 'loans',
    label: 'Loan Applications',
    icon: <FileText size={18} />,
  },
  {
    id: 'fraud',
    label: 'Fraud Alerts',
    icon: <AlertTriangle size={18} />,
  },
];

export function EmployeePortal() {
  const { loggedInEmployee } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (!loggedInEmployee) return null;

  const navByRole: Record<string, NavItem[]> = {
    'Customer Service Executive': NAV_ITEMS.filter((n) =>
      ['dashboard', 'customers', 'service'].includes(n.id)
    ),

    'KYC Officer': NAV_ITEMS.filter((n) =>
      ['dashboard', 'kyc', 'customers'].includes(n.id)
    ),

    'Loan Officer': NAV_ITEMS.filter((n) =>
      ['dashboard', 'loans', 'customers'].includes(n.id)
    ),

    'Fraud Analyst': NAV_ITEMS.filter((n) =>
      ['dashboard', 'fraud', 'customers'].includes(n.id)
    ),

    'Operations Manager': NAV_ITEMS,

    Admin: NAV_ITEMS,
  };

  const nav = navByRole[loggedInEmployee.role] || NAV_ITEMS;

  return (
    <PortalLayout
      navItems={nav}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userName={loggedInEmployee.full_name}
      userRole={loggedInEmployee.role}
      portalName="Employee Portal"
      accentColor="#006D77"
    >
      <div className="employee-portal">
        {activeSection === 'dashboard' && <EmployeeDashboard />}
        {activeSection === 'kyc' && <KycView />}
        {activeSection === 'customers' && <CustomersView />}
        {activeSection === 'service' && <EmployeeServiceRequests />}
        {activeSection === 'loans' && <EmployeeLoans />}
        {activeSection === 'fraud' && <FraudView />}
      </div>

      <SupportWidget />
    </PortalLayout>
  );
}

function useAllData<T>(table: string, select = '*') {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);

      const { count: total } = await supabase
        .from(table)
        .select('*', {
          count: 'exact',
          head: true,
        });

      const { data: result } = await supabase
        .from(table)
        .select(select)
        .range(
          page * pageSize,
          (page + 1) * pageSize - 1
        )
        .order('created_at', {
          ascending: false,
        });

      if (active) {
        setData((result || []) as T[]);
        setCount(total || 0);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [table, select, page]);

  return {
    data,
    loading,
    count,
    page,
    setPage,
    pageSize,
    setData,
  };
}

/* =========================================================
   EMPLOYEE DASHBOARD
========================================================= */

function EmployeeDashboard() {
  const { loggedInEmployee } = useAuth();

  const [stats, setStats] = useState({
    customers: 0,
    pendingKyc: 0,
    openService: 0,
    fraudAlerts: 0,
    pendingLoans: 0,
    todayTx: 0,
  });

  const [recentAlerts, setRecentAlerts] = useState<FraudAlert[]>([]);
  const [recentRequests, setRecentRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    (async () => {
      const [
        { count: customers },
        { count: pendingKyc },
        { count: openService },
        { count: fraudAlerts },
        { count: pendingLoans },
      ] = await Promise.all([
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .in('kyc_status', ['Pending', 'Under Review']),

        supabase
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Created', 'In Progress', 'Assigned']),

        supabase
          .from('fraud_alerts')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Open', 'Under Investigation']),

        supabase
          .from('loans')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Submitted', 'Under Review']),
      ]);

      setStats({
        customers: customers || 0,
        pendingKyc: pendingKyc || 0,
        openService: openService || 0,
        fraudAlerts: fraudAlerts || 0,
        pendingLoans: pendingLoans || 0,
        todayTx: 0,
      });

      const { data: alerts } = await supabase
        .from('fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentAlerts((alerts || []) as FraudAlert[]);

      const { data: reqs } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentRequests((reqs || []) as ServiceRequest[]);
    })();
  }, []);

  return (
    <div className="employee-page employee-dashboard">
      <section className="employee-hero">
        <div className="employee-hero-content">
          <h2>
            Welcome, {loggedInEmployee?.full_name}
          </h2>

          <p>
            {loggedInEmployee?.role}
            {' · '}
            {loggedInEmployee?.department}
            {' · '}
            {loggedInEmployee?.employee_id}
          </p>
        </div>
      </section>

      <section className="employee-stat-grid">
        <StatCard
          label="Total Customers"
          value={String(stats.customers)}
          icon={<Users size={22} />}
          color="#006D77"
        />

        <StatCard
          label="Pending KYC"
          value={String(stats.pendingKyc)}
          icon={<Shield size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Open Service Requests"
          value={String(stats.openService)}
          icon={<Settings size={22} />}
          color="#00B4D8"
        />

        <StatCard
          label="Active Fraud Alerts"
          value={String(stats.fraudAlerts)}
          icon={<AlertTriangle size={22} />}
          color="#FF8A80"
        />

        <StatCard
          label="Pending Loans"
          value={String(stats.pendingLoans)}
          icon={<FileText size={22} />}
          color="#006D77"
        />
      </section>

      <section className="employee-dashboard-grid">
        <Card className="employee-content-card">
          <h3 className="employee-card-title">
            Recent Fraud Alerts
          </h3>

          <div className="employee-list">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="employee-list-item"
              >
                <div className="employee-list-left">
                  <div className="employee-alert-icon">
                    <AlertTriangle size={18} />
                  </div>

                  <div>
                    <p className="employee-primary-text">
                      {alert.alert_type}
                    </p>

                    <p className="employee-secondary-text">
                      {formatCurrency(Number(alert.amount))}
                      {' · '}
                      Risk: {alert.risk_score}/100
                    </p>
                  </div>
                </div>

                <Badge
                  text={alert.status}
                  color={getStatusBadgeColor(alert.status)}
                />
              </div>
            ))}

            {recentAlerts.length === 0 && (
              <p className="employee-empty-text">
                No recent alerts
              </p>
            )}
          </div>
        </Card>

        <Card className="employee-content-card">
          <h3 className="employee-card-title">
            Recent Service Requests
          </h3>

          <div className="employee-list">
            {recentRequests.map((req) => (
              <div
                key={req.id}
                className="employee-list-item"
              >
                <div>
                  <p className="employee-primary-text">
                    {req.subject}
                  </p>

                  <p className="employee-secondary-text">
                    {req.request_type}
                    {' · '}
                    {req.ticket_id}
                  </p>
                </div>

                <Badge
                  text={req.status}
                  color={getStatusBadgeColor(req.status)}
                />
              </div>
            ))}

            {recentRequests.length === 0 && (
              <p className="employee-empty-text">
                No recent requests
              </p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

/* =========================================================
   KYC VIEW
========================================================= */

function KycView() {
  const {
    data: customers,
    loading,
    setData,
  } = useAllData<Customer>('customers');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = customers.filter((c) => {
    if (filter && c.kyc_status !== filter) {
      return false;
    }

    if (
      search &&
      !c.full_name.toLowerCase().includes(search.toLowerCase()) &&
      !c.customer_id.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const updateKyc = async (
    id: string,
    status: string
  ) => {
    await supabase
      .from('customers')
      .update({
        kyc_status: status,
      })
      .eq('id', id);

    setData(
      customers.map((c) =>
        c.id === id
          ? {
              ...c,
              kyc_status:
                status as Customer['kyc_status'],
            }
          : c
      )
    );

    setSelected(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (selected) {
    return (
      <div className="employee-page employee-detail-page">
        <button
          onClick={() => setSelected(null)}
          className="employee-back-button"
        >
          ← Back to KYC List
        </button>

        <Card className="employee-detail-card">
          <h3 className="employee-detail-title">
            KYC Review - {selected.full_name}
          </h3>

          <div className="employee-info-grid">
            <Info label="Customer ID" value={selected.customer_id} />
            <Info label="Full Name" value={selected.full_name} />
            <Info label="Date of Birth" value={formatDate(selected.dob)} />
            <Info label="Mobile" value={selected.mobile} />
            <Info label="Email" value={selected.email} />
            <Info label="PAN" value={selected.pan} />
            <Info label="Occupation" value={selected.occupation} />
            <Info label="City" value={selected.city} />
            <Info label="Address" value={selected.address} />
            <Info label="Risk Category" value={selected.risk_category} />
            <Info label="KYC Status" value={selected.kyc_status} />
            <Info label="Account Status" value={selected.account_status} />
          </div>

          <div className="employee-action-row">
            <Button
              onClick={() =>
                updateKyc(selected.id, 'Verified')
              }
            >
              <span className="employee-button-content">
                <CheckCircle2 size={16} />
                Approve KYC
              </span>
            </Button>

            <Button
              variant="danger"
              onClick={() =>
                updateKyc(selected.id, 'Rejected')
              }
            >
              <span className="employee-button-content">
                <XCircle size={16} />
                Reject KYC
              </span>
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                updateKyc(selected.id, 'Under Review')
              }
            >
              Mark Under Review
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="employee-page employee-section">
      <h3 className="employee-section-title">
        KYC Verification
      </h3>

      <div className="employee-filter-row">
        <div className="employee-search-wrapper">
          <Search
            className="employee-search-icon"
            size={18}
          />

          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="employee-search-input"
          />
        </div>

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
          className="employee-select"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <Card className="employee-table-card">
        <div className="employee-table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>PAN</th>
                <th>Risk</th>
                <th className="center">KYC Status</th>
                <th className="center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="employee-mono">
                    {c.customer_id}
                  </td>

                  <td className="employee-primary-cell">
                    {c.full_name}
                  </td>

                  <td>{c.pan}</td>

                  <td>
                    <Badge
                      text={c.risk_category}
                      color={
                        c.risk_category === 'High'
                          ? 'red'
                          : c.risk_category === 'Medium'
                          ? 'yellow'
                          : 'green'
                      }
                    />
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
                    <button
                      onClick={() =>
                        setSelected(c)
                      }
                      className="employee-view-button"
                    >
                      <Eye size={14} />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={<Shield size={28} />}
            title="No customers"
            message="No customers match your search."
          />
        )}
      </Card>
    </div>
  );
}

/* =========================================================
   CUSTOMERS VIEW
========================================================= */

function CustomersView() {
  const {
    data: customers,
    loading,
  } = useAllData<Customer>('customers');

  const [search, setSearch] = useState('');
  const [selected, setSelected] =
    useState<Customer | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.full_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      c.customer_id
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      c.email
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (selected) {
    return (
      <div className="employee-page employee-detail-page">
        <button
          onClick={() => setSelected(null)}
          className="employee-back-button"
        >
          ← Back to Customers
        </button>

        <Card className="employee-detail-card">
          <h3 className="employee-detail-title">
            Customer Profile - {selected.full_name}
          </h3>

          <div className="employee-info-grid">
            <Info label="Customer ID" value={selected.customer_id} />
            <Info label="Full Name" value={selected.full_name} />
            <Info label="Date of Birth" value={formatDate(selected.dob)} />
            <Info label="Mobile" value={selected.mobile} />
            <Info label="Email" value={selected.email} />
            <Info label="PAN" value={selected.pan} />
            <Info label="Occupation" value={selected.occupation} />
            <Info label="City" value={selected.city} />
            <Info label="Address" value={selected.address} />
            <Info label="Risk Category" value={selected.risk_category} />
            <Info
              label="Risk Score"
              value={`${selected.risk_score}/100`}
            />
            <Info label="KYC Status" value={selected.kyc_status} />
            <Info
              label="Account Status"
              value={selected.account_status}
            />
            <Info
              label="Registration Date"
              value={formatDate(
                selected.registration_date
              )}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="employee-page employee-section">
      <h3 className="employee-section-title">
        Customer Directory
      </h3>

      <div className="employee-search-wrapper employee-search-full">
        <Search
          className="employee-search-icon"
          size={18}
        />

        <input
          type="text"
          placeholder="Search by name, ID, or email..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="employee-search-input"
        />
      </div>

      <Card className="employee-table-card">
        <div className="employee-table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>City</th>
                <th>Risk</th>
                <th className="center">KYC</th>
                <th className="center">Status</th>
                <th className="center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="employee-mono">
                    {c.customer_id}
                  </td>

                  <td className="employee-primary-cell">
                    {c.full_name}
                  </td>

                  <td>{c.city}</td>

                  <td>
                    <Badge
                      text={c.risk_category}
                      color={
                        c.risk_category === 'High'
                          ? 'red'
                          : c.risk_category === 'Medium'
                          ? 'yellow'
                          : 'green'
                      }
                    />
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

                  <td className="center">
                    <button
                      onClick={() =>
                        setSelected(c)
                      }
                      className="employee-view-button"
                    >
                      <Eye size={14} />
                      View
                    </button>
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
            message="No customers match your search."
          />
        )}
      </Card>
    </div>
  );
}

/* =========================================================
   SERVICE REQUESTS
========================================================= */

function EmployeeServiceRequests() {
  const {
    data: requests,
    loading,
    setData,
  } = useAllData<ServiceRequest>(
    'service_requests'
  );

  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = requests.filter((r) => {
    if (filter && r.status !== filter) {
      return false;
    }

    if (
      search &&
      !r.subject
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      !r.ticket_id
        .toLowerCase()
        .includes(search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const updateStatus = async (
    id: string,
    status: string
  ) => {
    await supabase
      .from('service_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    setData(
      requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
            }
          : r
      )
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="employee-page employee-section">
      <h3 className="employee-section-title">
        Service Requests
      </h3>

      <div className="employee-filter-row">
        <div className="employee-search-wrapper">
          <Search
            className="employee-search-icon"
            size={18}
          />

          <input
            type="text"
            placeholder="Search by subject or ticket ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="employee-search-input"
          />
        </div>

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
          className="employee-select"
        >
          <option value="">All Statuses</option>
          <option value="Created">Created</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="employee-request-list">
        {filtered.map((req) => (
          <Card
            key={req.id}
            className="employee-request-card"
          >
            <div className="employee-request-header">
              <div>
                <div className="employee-request-title-row">
                  <h4 className="employee-request-title">
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

                <p className="employee-meta-text">
                  {req.ticket_id}
                  {' · '}
                  {formatDate(req.created_at)}
                </p>
              </div>

              <Badge
                text={req.status}
                color={getStatusBadgeColor(
                  req.status
                )}
              />
            </div>

            <p className="employee-description">
              {req.description}
            </p>

            <div className="employee-request-footer">
              <p className="employee-meta-text">
                Type: {req.request_type}
                {' · '}
                Assigned to:{' '}
                {req.assigned_to || 'Unassigned'}
              </p>

              <select
                value={req.status}
                onChange={(e) =>
                  updateStatus(
                    req.id,
                    e.target.value
                  )
                }
                className="employee-small-select"
              >
                <option value="Created">
                  Created
                </option>
                <option value="Assigned">
                  Assigned
                </option>
                <option value="In Progress">
                  In Progress
                </option>
                <option value="Waiting for Customer">
                  Waiting for Customer
                </option>
                <option value="Resolved">
                  Resolved
                </option>
                <option value="Closed">
                  Closed
                </option>
              </select>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon={<Settings size={28} />}
            title="No requests"
            message="No service requests match your search."
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   LOANS
========================================================= */

function EmployeeLoans() {
  const {
    data: loans,
    loading,
    setData,
  } = useAllData<Loan>('loans');

  const [filter, setFilter] = useState('');

  const filtered = filter
    ? loans.filter((l) => l.status === filter)
    : loans;

  const updateStatus = async (
    id: string,
    status: string
  ) => {
    await supabase
      .from('loans')
      .update({ status })
      .eq('id', id);

    setData(
      loans.map((l) =>
        l.id === id
          ? {
              ...l,
              status,
            }
          : l
      )
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="employee-page employee-section">
      <h3 className="employee-section-title">
        Loan Applications
      </h3>

      <div className="employee-filter-row">
        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
          className="employee-select"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">
            Under Review
          </option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Disbursed">Disbursed</option>
        </select>
      </div>

      <div className="employee-loan-grid">
        {filtered.map((loan) => (
          <Card
            key={loan.id}
            className="employee-loan-card"
          >
            <div className="employee-loan-header">
              <div>
                <h4 className="employee-loan-title">
                  {loan.loan_type} Loan
                </h4>

                <p className="employee-mono">
                  {loan.loan_id}
                </p>
              </div>

              <Badge
                text={loan.status}
                color={getStatusBadgeColor(
                  loan.status
                )}
              />
            </div>

            <div className="employee-loan-details">
              <div className="employee-detail-row">
                <span>Amount</span>
                <strong>
                  {formatCurrency(
                    Number(loan.loan_amount)
                  )}
                </strong>
              </div>

              <div className="employee-detail-row">
                <span>Interest</span>
                <strong>
                  {loan.interest_rate}%
                </strong>
              </div>

              <div className="employee-detail-row">
                <span>Tenure</span>
                <strong>
                  {loan.tenure_months} months
                </strong>
              </div>

              <div className="employee-detail-row">
                <span>Applied</span>
                <strong>
                  {formatDate(
                    loan.application_date
                  )}
                </strong>
              </div>
            </div>

            {(loan.status === 'Submitted' ||
              loan.status === 'Under Review') && (
              <div className="employee-action-row">
                <Button
                  onClick={() =>
                    updateStatus(
                      loan.id,
                      'Approved'
                    )
                  }
                >
                  <span className="employee-button-content">
                    <CheckCircle2 size={14} />
                    Approve
                  </span>
                </Button>

                <Button
                  variant="danger"
                  onClick={() =>
                    updateStatus(
                      loan.id,
                      'Rejected'
                    )
                  }
                >
                  <span className="employee-button-content">
                    <XCircle size={14} />
                    Reject
                  </span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={() =>
                    updateStatus(
                      loan.id,
                      'Under Review'
                    )
                  }
                >
                  Review
                </Button>
              </div>
            )}

            {loan.status === 'Approved' && (
              <div className="employee-disburse-action">
                <Button
                  onClick={() =>
                    updateStatus(
                      loan.id,
                      'Disbursed'
                    )
                  }
                >
                  Disburse Loan
                </Button>
              </div>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon={<FileText size={28} />}
            title="No loans"
            message="No loan applications found."
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   FRAUD VIEW
========================================================= */

function FraudView() {
  const {
    data: alerts,
    loading,
    setData,
  } = useAllData<FraudAlert>(
    'fraud_alerts'
  );

  const [filter, setFilter] = useState('');
  const [selected, setSelected] =
    useState<FraudAlert | null>(null);

  const filtered = filter
    ? alerts.filter(
        (a) => a.status === filter
      )
    : alerts;

  const updateAlertStatus = async (
    id: string,
    status: string
  ) => {
    await supabase
      .from('fraud_alerts')
      .update({ status })
      .eq('id', id);

    setData(
      alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
            }
          : a
      )
    );

    if (selected?.id === id) {
      setSelected({
        ...selected,
        status,
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (selected) {
    const riskLevel =
      selected.risk_score >= 75
        ? 'High'
        : selected.risk_score >= 50
        ? 'Medium'
        : 'Low';

    return (
      <div className="employee-page employee-detail-page">
        <button
          onClick={() => setSelected(null)}
          className="employee-back-button"
        >
          ← Back to Fraud Alerts
        </button>

        <Card className="employee-detail-card">
          <div className="employee-fraud-header">
            <div>
              <h3 className="employee-detail-title">
                Fraud Alert - {selected.alert_id}
              </h3>

              <p className="employee-secondary-text">
                {selected.alert_type}
              </p>
            </div>

            <Badge
              text={selected.status}
              color={getStatusBadgeColor(
                selected.status
              )}
            />
          </div>

          <div className="employee-fraud-warning">
            <div className="employee-fraud-warning-title">
              <AlertTriangle size={20} />

              <p>
                Suspicious Transaction Detected
              </p>
            </div>

            <p className="employee-fraud-warning-text">
              {selected.description}
            </p>
          </div>

          <div className="employee-info-grid">
            <Info
              label="Amount"
              value={formatCurrency(
                Number(selected.amount)
              )}
            />

            <Info
              label="Location"
              value={selected.location}
            />

            <Info
              label="Previous Location"
              value={
                selected.previous_location ||
                'N/A'
              }
            />

            <Info
              label="Time Difference"
              value={`${selected.time_difference_minutes} minutes`}
            />

            <Info
              label="Risk Score"
              value={`${selected.risk_score}/100 (${riskLevel})`}
            />

            <Info
              label="Created"
              value={formatDateTime(
                selected.created_at
              )}
            />
          </div>

          <div className="employee-action-row employee-fraud-actions">
            <Button
              onClick={() =>
                updateAlertStatus(
                  selected.id,
                  'Closed'
                )
              }
            >
              <span className="employee-button-content">
                <CheckCircle2 size={16} />
                Mark Genuine
              </span>
            </Button>

            <Button
              variant="danger"
              onClick={() =>
                updateAlertStatus(
                  selected.id,
                  'Under Investigation'
                )
              }
            >
              <span className="employee-button-content">
                <AlertTriangle size={16} />
                Escalate
              </span>
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                updateAlertStatus(
                  selected.id,
                  'Closed'
                )
              }
            >
              <span className="employee-button-content">
                <XCircle size={16} />
                Close Investigation
              </span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="employee-page employee-section">
      <h3 className="employee-section-title">
        Fraud Monitoring Dashboard
      </h3>

      <div className="employee-filter-row">
        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
          className="employee-select"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Under Investigation">
            Under Investigation
          </option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="employee-fraud-list">
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
              className={`employee-fraud-card ${riskClass}`}
            >
              <div className="employee-fraud-card-content">
                <div className="employee-fraud-left">
                  <div className="employee-fraud-icon">
                    <AlertTriangle size={20} />
                  </div>

                  <div>
                    <h4 className="employee-fraud-title">
                      {alert.alert_type}
                    </h4>

                    <p className="employee-meta-text employee-mono">
                      {alert.alert_id}
                      {' · '}
                      {formatDateTime(
                        alert.created_at
                      )}
                    </p>

                    <p className="employee-description">
                      {formatCurrency(
                        Number(alert.amount)
                      )}
                      {' · '}
                      {alert.location}
                      {' → '}
                      {alert.previous_location}
                    </p>
                  </div>
                </div>

                <div className="employee-fraud-score-area">
                  <p className="employee-fraud-score">
                    {alert.risk_score}
                  </p>

                  <p className="employee-score-label">
                    Risk Score
                  </p>

                  <button
                    onClick={() =>
                      setSelected(alert)
                    }
                    className="employee-view-button"
                  >
                    <Eye size={14} />
                    Review
                  </button>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState
            icon={<AlertTriangle size={28} />}
            title="No fraud alerts"
            message="No fraud alerts match your filter."
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INFO COMPONENT
========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="employee-info-item">
      <p className="employee-info-label">
        {label}
      </p>

      <p className="employee-info-value">
        {value || 'N/A'}
      </p>
    </div>
  );
}