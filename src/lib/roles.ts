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
    description: 'I want to track my own health, medications, and share my medical history with doctors.',
    icon: '🩺',
  },
  [ROLES.CLINICIAN]: {
    id: ROLES.CLINICIAN,
    label: 'Clinician',
    description: 'I am a doctor, nurse, or pharmacist. I will scan patient passports, review clinical summaries, and generate referrals.',
    icon: '👨‍⚕️',
  },
  [ROLES.CHW]: {
    id: ROLES.CHW,
    label: 'Community Health Worker',
    description: 'I work in the field triaging patients, following WHO protocols, and logging community encounters.',
    icon: '🏥',
  },
  [ROLES.ADMIN]: {
    id: ROLES.ADMIN,
    label: 'Administrator',
    description: 'I manage users, view aggregate statistics, and monitor the system\'s evaluation dashboard.',
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
