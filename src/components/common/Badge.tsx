import React from 'react';

interface BadgeProps {
  variant?: 'role' | 'status' | 'general';
  value: string | boolean | null | undefined;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'status', value, size = 'sm' }) => {
  if (value === null || value === undefined) {
    return <span className="badge badge-neutral">—</span>;
  }

  const str = String(value).toLowerCase();

  let colorClass = 'badge-neutral';
  let label = str;

  if (variant === 'role') {
    if (str === 'admin') {
      colorClass = 'badge-purple';
      label = 'Admin';
    } else if (str === 'provider') {
      colorClass = 'badge-blue';
      label = 'Provider / Landlord';
    } else if (str === 'student') {
      colorClass = 'badge-teal';
      label = 'Student';
    }
  } else {
    // Status variant
    if (['verified', 'active', 'resolved', 'completed', 'true'].includes(str)) {
      colorClass = 'badge-success';
      label = str === 'true' ? 'Active' : str.charAt(0).toUpperCase() + str.slice(1);
    } else if (['pending', 'requested', 'open', 'in_progress'].includes(str)) {
      colorClass = 'badge-warning';
      label = str.charAt(0).toUpperCase() + str.slice(1);
    } else if (['rejected', 'suspended', 'cancelled', 'declined', 'missed', 'false'].includes(str)) {
      colorClass = 'badge-danger';
      label = str === 'false' ? 'Inactive' : str.charAt(0).toUpperCase() + str.slice(1);
    } else if (['confirmed', 'reviewed'].includes(str)) {
      colorClass = 'badge-info';
      label = str.charAt(0).toUpperCase() + str.slice(1);
    }
  }

  return (
    <span className={`badge ${colorClass} badge-${size}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};
