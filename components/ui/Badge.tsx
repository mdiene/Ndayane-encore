import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
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