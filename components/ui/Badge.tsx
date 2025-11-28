import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: "badge-success text-white",
    warning: "badge-warning text-white",
    error: "badge-error text-white",
    info: "badge-info text-white",
    neutral: "badge-neutral",
    primary: "badge-primary"
  };

  return (
    <span className={`badge ${styles[variant]} badge-sm py-3 font-medium`}>
      {children}
    </span>
  );
};

export const getStatusBadgeVariant = (status: string): BadgeProps['variant'] => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'decharge':
    case 'delivered':
      return 'success';
    case 'en_transit':
    case 'planifie':
      return 'info';
    case 'maintenance':
    case 'retarde':
      return 'warning';
    case 'demobilise':
    case 'annule':
    case 'inactive':
      return 'error';
    default:
      return 'neutral';
  }
};