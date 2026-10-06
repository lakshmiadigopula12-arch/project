import { useState } from 'react';
import {
  Shield,
  ArrowLeft,
  User,
  Lock,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BANK_INFO } from '@/lib/constants';
import '@/components/LoginPage.css';

export function LoginPage() {
  const {
    currentPortal,
    setCurrentPortal,
    loginAsCustomer,
    loginAsEmployee,
  } = useAuth();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isCustomer = currentPortal === 'customer';

  const portalTitle = isCustomer
    ? 'Customer Portal'
    : currentPortal === 'employee'
      ? 'Employee Portal'
      : 'Admin Portal';

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    const idLabel = isCustomer ? 'Customer ID' : 'Employee ID';

    if (!id.trim() || !password.trim()) {
      setError(`${idLabel} and password are required.`);
      setLoading(false);
      return;
    }

    const result = isCustomer
      ? await loginAsCustomer(id.trim(), password)
      : await loginAsEmployee(id.trim(), password);

    if (!result.success) {
      setError(result.error || 'Login failed.');
    }

    setLoading(false);
  };

  const demoAccounts = isCustomer
    ? [
        { id: 'CUST-10001', name: 'Arjun Reddy' },
        { id: 'CUST-10002', name: 'Priya Sharma' },
        { id: 'CUST-10006', name: 'Ananya Gupta' },
      ]
    : [
        { id: 'EMP-001', name: 'Customer Service Executive' },
        { id: 'EMP-003', name: 'Loan Officer' },
        { id: 'EMP-006', name: 'Admin' },
      ];

  return (
    <div className="login-page">
      <div className="login-container">

        <button
          onClick={() => setCurrentPortal('landing')}
          className="login-back-button"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="login-card">

          <div className="login-header">
            <div className="login-logo">
              <Shield size={32} />
            </div>

            <h1>{portalTitle}</h1>

            <p>
              Sign in to {BANK_INFO.name}
            </p>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-form">

            <div className="login-field">
              <label>
                {isCustomer ? 'Customer ID' : 'Employee ID'}
              </label>

              <div className="login-input-wrapper">
                <User className="login-input-icon" size={18} />

                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder={
                    isCustomer
                      ? 'e.g. CUST-10001'
                      : 'e.g. EMP-001'
                  }
                  className="login-input"
                />
              </div>
            </div>

            <div className="login-field">
              <label>Password</label>

              <div className="login-input-wrapper">
                <Lock className="login-input-icon" size={18} />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleLogin()
                  }
                  placeholder="Enter password"
                  className="login-input"
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="login-submit-button"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </div>

          <div className="login-demo-box">

            <div className="login-demo-header">
              <Info size={17} />

              <p>
                Demo Accounts (password: demo123)
              </p>
            </div>

            <div className="login-demo-list">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setId(acc.id);
                    setPassword('demo123');
                  }}
                  className="login-demo-account"
                >
                  <span className="login-demo-id">
                    {acc.id}
                  </span>

                  <span className="login-demo-name">
                    {acc.name}
                  </span>
                </button>
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}