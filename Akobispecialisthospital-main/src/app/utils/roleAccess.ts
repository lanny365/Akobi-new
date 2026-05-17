export type StaffPortalRole = 'reception' | 'cashier' | 'nurse' | 'accountant';
export type AppPortalRole = StaffPortalRole | 'doctor' | 'surgeon' | 'anesthetist';

export const roleLabels: Record<AppPortalRole, string> = {
  reception: 'Reception',
  cashier: 'Cashier',
  nurse: 'Nurse',
  accountant: 'Accountant',
  doctor: 'Doctor',
  surgeon: 'Surgeon',
  anesthetist: 'Anesthetist',
};

export const roleDefaultPaths: Record<AppPortalRole, string> = {
  reception: '/patient-management',
  cashier: '/cashier',
  nurse: '/nursing',
  accountant: '/accounts?section=accounting',
  doctor: '/doctor-login',
  surgeon: '/theatre?tab=surgeon',
  anesthetist: '/theatre?tab=anesthetist',
};

const roleAllowedBasePaths: Record<Exclude<AppPortalRole, 'surgeon' | 'anesthetist'>, string[]> = {
  reception: ['/reception', '/patient-management', '/card-management', '/customer-care', '/discharge-patient', '/utility'],
  cashier: ['/cashier'],
  nurse: ['/nursing', '/vital-signs'],
  accountant: ['/accounts'],
  doctor: ['/doctor-login'],
};

export function getRoleDefaultPath(role: AppPortalRole): string {
  return roleDefaultPaths[role];
}

export function getAllowedPathsForRole(role: AppPortalRole): string[] {
  if (role === 'surgeon') {
    return ['/theatre?tab=surgeon'];
  }

  if (role === 'anesthetist') {
    return ['/theatre?tab=anesthetist'];
  }

  return roleAllowedBasePaths[role];
}

export function isPathAllowedForRole(path: string, role: AppPortalRole): boolean {
  const [basePath, queryString = ''] = path.split('?');

  if (role === 'surgeon' || role === 'anesthetist') {
    if (basePath !== '/theatre') {
      return false;
    }

    const activeTab = new URLSearchParams(queryString).get('tab');
    return !activeTab || activeTab === role;
  }

  return roleAllowedBasePaths[role].includes(basePath);
}
