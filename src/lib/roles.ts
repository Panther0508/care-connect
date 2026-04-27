export const ROLES = {
  PATIENT: 'patient',
  CLINICIAN: 'clinician',
  CHW: 'chw',
  ADMIN: 'admin',
} as const;

export type UserRole = keyof typeof ROLES;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.PATIENT]: [
    'health_graph:read',
    'health_graph:write',
    'passport:share',
    'passport:read',
    'needs:register',
    'alerts:read',
  ],
  [ROLES.CLINICIAN]: [
    'passport:scan',
    'passport:read',
    'health_graph:read',
    'health_graph:write:with_consent',
    'patient:search',
    'alerts:read',
  ],
  [ROLES.CHW]: [
    'mesh:sync',
    'mesh:confirm',
    'needs:register',
    'needs:read',
    'facility:confirm',
    'outbreaks:read',
  ],
  [ROLES.ADMIN]: [
    'users:read',
    'users:write',
    'users:impersonate',
    'analytics:read',
    'settings:read',
    'settings:write',
    'org:configure',
    'audit:read',
    'export:data',
  ],
};

export interface RoleInfo {
  id: UserRole;
  label: string;
  description: string;
  icon: string;
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  [ROLES.PATIENT]: {
    id: ROLES.PATIENT,
    label: 'Patient',
    description: 'Manage your health records, share with clinicians, track your wellness journey.',
    icon: '🩺',
  },
  [ROLES.CLINICIAN]: {
    id: ROLES.CLINICIAN,
    label: 'Clinician',
    description: 'Scan patient passports, view health summaries, add clinical notes with consent.',
    icon: '👨‍⚕️',
  },
  [ROLES.CHW]: {
    id: ROLES.CHW,
    label: 'Community Health Worker',
    description: 'Monitor mesh activity, track outbreaks, register community health needs.',
    icon: '🏥',
  },
  [ROLES.ADMIN]: {
    id: ROLES.ADMIN,
    label: 'Administrator',
    description: 'Manage users, configure organization settings, view analytics and compliance.',
    icon: '⚙️',
  },
};

export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  // Exact match
  if (permissions.includes(permission)) return true;

  // Wildcard checks
  if (permission.includes(':')) {
    const [resource, action] = permission.split(':');
    const wildcard = `${resource}:*`;
    return permissions.includes(wildcard);
  }

  return false;
}

export function getRoleFromMetadata(publicMetadata: any): UserRole | null {
  if (!publicMetadata?.role) return null;
  return publicMetadata.role as UserRole;
}
