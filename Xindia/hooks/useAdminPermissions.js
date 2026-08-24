'use client';

import { useState, useEffect } from 'react';

/**
 * Custom React hook to check admin role and granular permissions safely.
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
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const hasPermission = (permKey) => {
    if (!loaded) return false;
    if (isSuperAdmin) return true;
    if (permissions.includes('*')) return true;
    if (Array.isArray(permKey)) {
      return permKey.some((k) => permissions.includes(k));
    }
    return permissions.includes(permKey);
  };

  return {
    loaded,
    profile,
    role,
    permissions,
    isSuperAdmin,
    hasPermission,
    // Specialized high-risk capabilities
    canBlockSellers: isSuperAdmin,
    canDeactivateSellers: isSuperAdmin,
    canManageStaff: isSuperAdmin,
    canManagePlans: isSuperAdmin,
    canManageCredits: isSuperAdmin,
    canManageSettings: isSuperAdmin,
  };
}

export default useAdminPermissions;
