import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserAccountStatus } from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { UserAnnouncementModal } from './UserAnnouncementModal';
import {
  Search,
  UserX,
  UserCheck,
  Send,
  Users as UsersIcon,
  Filter,
} from 'lucide-react';
import type { User } from '../../types';

export const UsersList: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Modals state
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<User | null>(null);
  const [statusAction, setStatusAction] = useState<'suspend' | 'activate'>('suspend');
  const [announcementUser, setAnnouncementUser] = useState<User | null>(null);

  // Fetch users with React Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'users', roleFilter, statusFilter, debouncedSearch],
    queryFn: () =>
      getUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        q: debouncedSearch || undefined,
      }),
  });

  // Mutate user account status (suspend / activate)
  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      status,
      reason,
    }: {
      userId: string;
      status: 'active' | 'suspended';
      reason?: string;
    }) => updateUserAccountStatus(userId, { status, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(
        'success',
        variables.status === 'suspended'
          ? 'User account has been suspended'
          : 'User account has been reactivated'
      );
      setSelectedUserForStatus(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update account status');
    },
  });

  const handleOpenSuspend = (user: User) => {
    setSelectedUserForStatus(user);
    setStatusAction('suspend');
  };

  const handleOpenActivate = (user: User) => {
    setSelectedUserForStatus(user);
    setStatusAction('activate');
  };

  const handleConfirmStatusChange = async (reason?: string) => {
    if (!selectedUserForStatus) return;
    const newStatus = statusAction === 'suspend' ? 'suspended' : 'active';
    await statusMutation.mutateAsync({
      userId: selectedUserForStatus.id,
      status: newStatus,
      reason: reason || (newStatus === 'active' ? 'Reactivated by administrator' : undefined),
    });
  };

  const users = data?.users || [];

  return (
    <div className="section-container">
      {/* Search & Filters Bar */}
      <div className="filter-card">
        <div className="filter-row">
          <div className="search-field">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, email, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-group">
            <Filter size={16} className="text-muted" />

            {/* Role Filter */}
            <select
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="provider">Providers / Landlords</option>
              <option value="admin">Administrators</option>
            </select>

            {/* Status Filter */}
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by account status"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="filter-meta">
          <span className="results-count">
            Found <strong>{users.length}</strong> {users.length === 1 ? 'user' : 'users'}
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card mt-4">
        {isLoading ? (
          <div className="p-8">
            <div className="table-skeleton" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-danger font-medium">Failed to load users directory</p>
            <p className="text-muted text-sm mt-1">{(error as Error)?.message}</p>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description="Try adjusting your search query or role/status filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setRoleFilter('');
              setStatusFilter('');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Verification</th>
                  <th>Registered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentAdmin = user.role === 'admin';

                  return (
                    <tr key={user.id} className={!user.isActive ? 'row-suspended' : ''}>
                      <td>
                        <div className="user-cell">
                          <div
                            className={`avatar-circle ${
                              user.role === 'admin'
                                ? 'avatar-admin'
                                : user.role === 'provider'
                                ? 'avatar-provider'
                                : 'avatar-student'
                            }`}
                          >
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <span className="user-cell-name">
                              {user.name || 'Unnamed User'}
                            </span>
                            <span className="user-cell-email">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <Badge variant="role" value={user.role} />
                      </td>

                      <td>
                        <Badge variant="status" value={user.isActive ? 'active' : 'suspended'} />
                      </td>

                      <td>
                        {user.verificationStatus ? (
                          <Badge variant="status" value={user.verificationStatus} />
                        ) : (
                          <span className="text-muted text-xs">N/A</span>
                        )}
                      </td>

                      <td>
                        <span className="text-xs text-muted">
                          {new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Announcement button */}
                          <button
                            type="button"
                            className="btn-action"
                            title={`Send direct notice to ${user.email}`}
                            onClick={() => setAnnouncementUser(user)}
                            aria-label="Send announcement"
                          >
                            <Send size={15} />
                          </button>

                          {/* Suspend or Reactivate button (disabled for admin accounts) */}
                          {!isCurrentAdmin && (
                            <>
                              {user.isActive ? (
                                <button
                                  type="button"
                                  className="btn-action btn-action-danger"
                                  title="Suspend account"
                                  onClick={() => handleOpenSuspend(user)}
                                  aria-label="Suspend user"
                                >
                                  <UserX size={15} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-action btn-action-success"
                                  title="Reactivate account"
                                  onClick={() => handleOpenActivate(user)}
                                  aria-label="Reactivate user"
                                >
                                  <UserCheck size={15} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspension / Activation Confirm Dialog */}
      {selectedUserForStatus && (
        <ConfirmDialog
          isOpen={!!selectedUserForStatus}
          onClose={() => setSelectedUserForStatus(null)}
          onConfirm={handleConfirmStatusChange}
          title={
            statusAction === 'suspend'
              ? `Suspend User: ${selectedUserForStatus.email}`
              : `Reactivate User: ${selectedUserForStatus.email}`
          }
          message={
            statusAction === 'suspend'
              ? `Suspending this user will revoke their active session and deny future access to student/provider platform features.`
              : `Reactivating this user will restore their sign-in capability and access to their account.`
          }
          confirmLabel={statusAction === 'suspend' ? 'Suspend Account' : 'Reactivate Account'}
          variant={statusAction === 'suspend' ? 'danger' : 'success'}
          requireReason={statusAction === 'suspend'}
          reasonPlaceholder="State the policy violation or reason for suspension..."
          isLoading={statusMutation.isPending}
        />
      )}

      {/* Direct Announcement Modal */}
      {announcementUser && (
        <UserAnnouncementModal
          user={announcementUser}
          isOpen={!!announcementUser}
          onClose={() => setAnnouncementUser(null)}
        />
      )}
    </div>
  );
};
