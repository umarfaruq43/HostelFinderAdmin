import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'purple' | 'teal' | 'amber' | 'blue' | 'rose' | 'emerald';
  badge?: string;
  badgeType?: 'warning' | 'success' | 'info' | 'danger';
  subtext?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'purple',
  badge,
  badgeType = 'info',
  subtext,
  isLoading = false,
  onClick,
}) => {
  return (
    <div
      className={`stat-card stat-${color} ${onClick ? 'cursor-pointer hover-lift' : ''}`}
      onClick={onClick}
    >
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className={`stat-icon-wrapper icon-${color}`}>
          <Icon size={22} />
        </div>
      </div>

      <div className="stat-body">
        {isLoading ? (
          <div className="skeleton skeleton-val" />
        ) : (
          <div className="stat-value">{value}</div>
        )}

        {(badge || subtext) && (
          <div className="stat-meta">
            {badge && (
              <span className={`stat-badge badge-${badgeType}`}>{badge}</span>
            )}
            {subtext && <span className="stat-subtext">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
