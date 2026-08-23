'use strict';
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  UserPlus,
  Search,
  KeyRound,
  Shield,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import Modal from '@/components/admin/Modal';
import Badge from '@/components/admin/Badge';
import Toggle from '@/components/admin/Toggle';

const ROLES = [
  { value: 'STAFF', label: 'Staff (Operations)', desc: 'Can verify docs, edit profiles, moderate' },
  { value: 'SUPPORT_AGENT', label: 'Support Agent', desc: 'Customer support and profile assistance' },
  { value: 'MODERATOR', label: 'Moderator', desc: 'Review & feedback moderation' },
  { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer', desc: 'Document verification & verification decisions' },
  { value: 'OPERATIONS_ADMIN', label: 'Operations Admin', desc: 'Operations, seller status & onboarding' },
  { value: 'PLATFORM_ADMIN', label: 'Platform Admin', desc: 'Full administrative access' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Master root administrator' },
];

const ROLE_COLORS = {
  SUPER_ADMIN: '#E8581C',
  PLATFORM_ADMIN: '#2563EB',
  OPERATIONS_ADMIN: '#7C3AED',
  STAFF: '#059669',
  SUPPORT_AGENT: '#0891B2',
  MODERATOR: '#D97706',
  COMPLIANCE_OFFICER: '#4F46E5',
};

const PRESET_PERMISSIONS = [
  { key: 'manufacturers.edit', label: 'Edit Manufacturer Profiles' },
  { key: 'documents.verify', label: 'Verify Business Documents' },
  { key: 'reviews.moderate', label: 'Moderate Reviews & Feedback' },
  { key: 'buyers.block', label: 'Suspend & Block Buyers' },
  { key: 'products.moderate', label: 'Manage Product Visibility' },
];

function generateStrongPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  const [copiedKey, setCopiedKey] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('STAFF');
  const [newPermissions, setNewPermissions] = useState([
    'manufacturers.edit',
    'documents.verify',
    'reviews.moderate',
  ]);
  const [showNewPassword, setShowNewPassword] = useState(true);

  // Edit form state
  const [editRole, setEditRole] = useState('');
  const [editPermissions, setEditPermissions] = useState([]);
  const [editActive, setEditActive] = useState(true);

  // Reset password state
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (activeFilter) params.set('active', activeFilter);
      params.set('limit', '50');

      const res = await fetch(`/api/admin/staff?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
        setTotalCount(data.total || 0);
      } else {
        setAlertMsg({ type: 'error', text: data.message || 'Failed to load staff list' });
      }
    } catch (err) {
      console.error(err);
      setAlertMsg({ type: 'error', text: 'Network error loading staff accounts' });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, activeFilter]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 4000);
  };

  const handleOpenCreateModal = () => {
    setNewUsername('');
    setNewEmail('');
    setNewPassword(generateStrongPassword());
    setNewRole('STAFF');
    setNewPermissions(['manufacturers.edit', 'documents.verify', 'reviews.moderate']);
    setShowNewPassword(true);
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
          permissions: newPermissions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        showAlert('success', `Staff account "${newUsername}" created successfully!`);
        loadStaff();
      } else {
        showAlert('error', data.message || 'Failed to create staff account');
      }
    } catch (err) {
      showAlert('error', 'Network error creating staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (staff) => {
    setEditTarget(staff);
    setEditRole(staff.role);
    setEditPermissions(staff.permissions || []);
    setEditActive(staff.active !== false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${editTarget._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          permissions: editPermissions,
          active: editActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditTarget(null);
        showAlert('success', `Staff account "${editTarget.username}" updated successfully!`);
        loadStaff();
      } else {
        showAlert('error', data.message || 'Failed to update staff account');
      }
    } catch (err) {
      showAlert('error', 'Network error updating staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPasswordModal = (staff) => {
    setPasswordTarget(staff);
    setResetPasswordVal(generateStrongPassword());
    setShowResetPassword(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordTarget || !resetPasswordVal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${passwordTarget._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: resetPasswordVal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordTarget(null);
        showAlert('success', `Password for "${passwordTarget.username}" reset successfully!`);
        loadStaff();
      } else {
        showAlert('error', data.message || 'Failed to reset password');
      }
    } catch (err) {
      showAlert('error', 'Network error resetting password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (staff) => {
    try {
      const nextActive = !staff.active;
      const res = await fetch(`/api/admin/staff/${staff._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', `Account ${staff.username} ${nextActive ? 'activated' : 'deactivated'}.`);
        loadStaff();
      } else {
        showAlert('error', data.message || 'Failed to toggle status');
      }
    } catch (err) {
      showAlert('error', 'Error updating account status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', data.message || 'Staff member removed successfully');
        setDeleteTarget(null);
        loadStaff();
      } else {
        showAlert('error', data.message || 'Failed to delete staff account');
      }
    } catch (err) {
      showAlert('error', 'Network error deleting staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Quick stats
  const activeCount = staffList.filter((s) => s.active).length;
  const staffRoleCount = staffList.filter((s) => s.role === 'STAFF').length;
  const adminRoleCount = staffList.filter((s) => ['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(s.role)).length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCog size={26} color="#E8581C" /> Staff & Team Management
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Manage staff credentials, role-based access permissions, and account statuses.
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13 }}
          onClick={handleOpenCreateModal}
        >
          <UserPlus size={16} /> + Add Staff Member
        </button>
      </div>

      {/* Alert Notice */}
      {alertMsg.text && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: alertMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
          color: alertMsg.type === 'success' ? '#15803D' : '#B91C1C',
          padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600,
        }}>
          {alertMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {alertMsg.text}
        </div>
      )}

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Accounts</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{totalCount}</div>
        </div>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Active Staff</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>{activeCount}</div>
        </div>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0891B2', textTransform: 'uppercase' }}>Staff Members</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0891B2', marginTop: 4 }}>{staffRoleCount}</div>
        </div>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#E8581C', textTransform: 'uppercase' }}>Admins</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#E8581C', marginTop: 4 }}>{adminRoleCount}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="admin-card" style={{ padding: 14, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', flex: '1 1 200px' }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13 }}
          />
        </div>

        <select
          className="admin-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ minWidth: 160 }}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <select
          className="admin-select"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          style={{ minWidth: 130 }}
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>

        {(search || roleFilter || activeFilter) && (
          <button
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: 12 }}
            onClick={() => { setSearch(''); setRoleFilter(''); setActiveFilter(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Staff Members Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#94A3B8' }}>Loading accounts...</div>
        ) : staffList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#64748B' }}>No staff members found matching your search.</div>
        ) : (
          <table className="admin-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Username & Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => {
                const roleColor = ROLE_COLORS[staff.role] || '#64748B';
                const roleObj = ROLES.find((r) => r.value === staff.role) || { label: staff.role };
                const isSuper = staff.role === 'SUPER_ADMIN';

                return (
                  <tr key={staff._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{staff.username}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{staff.email}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: roleColor, color: '#fff', letterSpacing: '0.02em',
                      }}>
                        {roleObj.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: '#475569', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isSuper ? (
                          <span style={{ color: '#E8581C', fontWeight: 700 }}>Full Superadmin Access (*)</span>
                        ) : (staff.permissions && staff.permissions.length > 0) ? (
                          <span>{staff.permissions.length} custom permission(s)</span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>Standard Role Defaults</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Toggle checked={staff.active !== false} onChange={() => handleToggleActive(staff)} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: staff.active ? '#059669' : '#94A3B8' }}>
                          {staff.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Edit Role & Permissions"
                          onClick={() => handleOpenEditModal(staff)}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Reset Password"
                          onClick={() => handleOpenPasswordModal(staff)}
                        >
                          <KeyRound size={12} /> Key
                        </button>
                        {!isSuper && (
                          <button
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="Delete Account"
                            onClick={() => setDeleteTarget(staff)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── ADD STAFF MODAL ─── */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add Staff Member">
        <form onSubmit={handleCreateSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Username *</label>
            <input
              className="admin-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. rahul_support"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email Address *</label>
            <input
              type="email"
              className="admin-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. rahul@xindia.market"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Temporary Password *</label>
              <button
                type="button"
                onClick={() => setNewPassword(generateStrongPassword())}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={12} /> Generate
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="admin-input"
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: 70, fontFamily: 'monospace', fontWeight: 700 }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2 }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newPassword)}
                  style={{ background: 'none', border: 'none', color: copiedKey ? '#15803D' : '#64748B', cursor: 'pointer', padding: 2 }}
                >
                  {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748B' }}>Provide this password to the staff member. They can log in via /login (Admin/Staff tab).</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Role & Authority Level *</label>
            <select
              className="admin-select"
              style={{ width: '100%' }}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              {ROLES.filter((r) => r.value !== 'SUPER_ADMIN').map((r) => (
                <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Permissions & Capabilities</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              {PRESET_PERMISSIONS.map((perm) => {
                const checked = newPermissions.includes(perm.key);
                return (
                  <label key={perm.key} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setNewPermissions(
                          checked ? newPermissions.filter((k) => k !== perm.key) : [...newPermissions, perm.key]
                        );
                      }}
                    />
                    {perm.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setCreateModalOpen(false)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── EDIT STAFF MODAL ─── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit Staff: ${editTarget?.username}`}>
        <form onSubmit={handleEditSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Role</label>
            <select
              className="admin-select"
              style={{ width: '100%' }}
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Permissions</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              {PRESET_PERMISSIONS.map((perm) => {
                const checked = editPermissions.includes(perm.key);
                return (
                  <label key={perm.key} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setEditPermissions(
                          checked ? editPermissions.filter((k) => k !== perm.key) : [...editPermissions, perm.key]
                        );
                      }}
                    />
                    {perm.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Toggle checked={editActive} onChange={setEditActive} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Active Account (Enabled)</span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── RESET PASSWORD MODAL ─── */}
      <Modal open={!!passwordTarget} onClose={() => setPasswordTarget(null)} title={`Reset Password: ${passwordTarget?.username}`}>
        <form onSubmit={handlePasswordSubmit}>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 14px' }}>
            Setting a new password will immediately expire any active sessions for <strong>{passwordTarget?.username}</strong>.
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>New Password *</label>
              <button
                type="button"
                onClick={() => setResetPasswordVal(generateStrongPassword())}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={12} /> Generate
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showResetPassword ? 'text' : 'password'}
                className="admin-input"
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: 70, fontFamily: 'monospace', fontWeight: 700 }}
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                required
              />
              <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2 }}
                >
                  {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(resetPasswordVal)}
                  style={{ background: 'none', border: 'none', color: copiedKey ? '#15803D' : '#64748B', cursor: 'pointer', padding: 2 }}
                >
                  {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setPasswordTarget(null)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
              {submitting ? 'Resetting...' : 'Confirm Reset Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── DELETE CONFIRM MODAL ─── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Staff Account">
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#334155' }}>
          Are you sure you want to permanently delete administrative account <strong>{deleteTarget?.username}</strong> ({deleteTarget?.email})?
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="admin-btn admin-btn-danger" onClick={handleDeleteConfirm} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Yes, Delete Account'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
