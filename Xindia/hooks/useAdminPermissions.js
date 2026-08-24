'use client';

import { useState, useEffect } from 'react';

/**
 * Custom React hook to check admin role and granular permissions safely.
 * MASTER_ADMIN is treated as a super admin for all UI purposes but is never
 * identified as such visually — the role label just shows as-is.
 */
export function useAdminPermissions() {
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_profile');
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (e) {
      console.error('[useAdminPermissions] Error reading admin profile:', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  const role = profile?.role || null;
  const permissions = Array.isArray(profile?.permissions) ? profile.permissions : [];
  // MASTER_ADMIN and SUPER_ADMIN are both treated as super admin for all UI gates.
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'MASTER_ADMIN';

  const hasPermission = (permKey) => {
    if (!loaded) return false;
    if (isSuperAdmin) return true;
    if (permissions.includes('*')) return true;
    if (Array.isArray(permKey)) {
      return permKey.some((k) => permissions.includes(k));
    }
    return permissions.includes(permKey);
  };

  // Capability flags — each can be independently delegated to non-super-admin staff.
  const canManageStaff   = isSuperAdmin; // Staff management is NEVER delegatable.
  const canManagePlans   = isSuperAdmin || hasPermission('plans.manage');
  const canManageCredits = isSuperAdmin || hasPermission('credits.manage');

  return {
    loaded,
    profile,
    role,
    permissions,
    isSuperAdmin,
    hasPermission,
    // Specific capability flags
    canBlockSellers:    isSuperAdmin,
    canDeactivateSellers: isSuperAdmin,
    canManageStaff,
    canManagePlans,
    canManageCredits,
    canManageSettings:  isSuperAdmin,
  };
}

export default useAdminPermissions;
