import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import './ui.css';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`ui-card ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color = '#006D77',
  subtext,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  color?: string;
  subtext?: string;
}) {
  return (
    <Card className="ui-stat-card">

      <div className="ui-stat-content">

        <div className="ui-stat-info">
          <p className="ui-stat-label">
            {label}
          </p>

          <p className="ui-stat-value">
            {value}
          </p>

          {subtext && (
            <p className="ui-stat-subtext">
              {subtext}
            </p>
          )}
        </div>

        <div
          className="ui-stat-icon"
          style={{
            backgroundColor: color,
          }}
        >
          <span style={{ color: '#006D77' }}>
            {icon}
          </span>
        </div>

      </div>

    </Card>
  );
}

export function Badge({
  text,
  color,
}: {
  text: string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}) {
  return (
    <span className={`ui-badge ui-badge-${color}`}>
      {text}
    </span>
  );
}

export function getStatusBadgeColor(
  status: string
): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
  const s = status.toLowerCase();

  if (
    s.includes('success') ||
    s.includes('verified') ||
    s.includes('active') ||
    s.includes('resolved') ||
    s.includes('approved') ||
    s.includes('disbursed') ||
    s.includes('closed')
  ) {
    return 'green';
  }

  if (
    s.includes('pending') ||
    s.includes('review') ||
    s.includes('progress') ||
    s.includes('submitted') ||
    s.includes('draft') ||
    s.includes('assigned') ||
    s.includes('waiting')
  ) {
    return 'yellow';
  }

  if (
    s.includes('failed') ||
    s.includes('rejected') ||
    s.includes('blocked') ||
    s.includes('frozen') ||
    s.includes('expired') ||
    s.includes('open')
  ) {
    return 'red';
  }

  if (
    s.includes('reversed') ||
    s.includes('created')
  ) {
    return 'blue';
  }

  return 'gray';
}

export function LoadingSpinner({
  text = 'Loading...',
}: {
  text?: string;
}) {
  return (
    <div className="ui-loading">
      <Loader2
        className="ui-loading-icon"
        size={32}
      />

      <span className="ui-loading-text">
        {text}
      </span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="ui-empty-state">

      <div className="ui-empty-icon">
        {icon}
      </div>

      <h3 className="ui-empty-title">
        {title}
      </h3>

      <p className="ui-empty-message">
        {message}
      </p>

    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="ui-pagination">

      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="ui-pagination-button"
      >
        Previous
      </button>

      <span className="ui-pagination-info">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="ui-pagination-button"
      >
        Next
      </button>

    </div>
  );
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="ui-field">

      <label className="ui-label">
        {label}

        {required && (
          <span className="ui-required">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ui-input"
      />

    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="ui-field">

      <label className="ui-label">
        {label}

        {required && (
          <span className="ui-required">
            *
          </span>
        )}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ui-select"
      >
        <option value="">
          Select {label}
        </option>

        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
          >
            {opt.label}
          </option>
        ))}
      </select>

    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent';
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`ui-button ui-button-${variant} ${className}`}
    >
      {children}
    </button>
  );
}