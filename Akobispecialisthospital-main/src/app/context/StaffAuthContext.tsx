import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { StaffPortalRole } from '../utils/roleAccess';

const STAFF_AUTH_STORAGE_KEY = 'akobi_staff_auth';

export interface StaffPortalUser {
  id: string;
  fullName: string;
  email: string;
  role: StaffPortalRole;
  department: string;
}

interface StaffAuthContextType {
  currentStaff: StaffPortalUser | null;
  login: (email: string, password: string, role: StaffPortalRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

const mockStaffUsers: Array<StaffPortalUser & { password: string }> = [
  {
    id: 'REC-001',
    fullName: 'Amina Bello',
    email: 'reception@akobi.com',
    password: 'reception123',
    role: 'reception',
    department: 'Reception',
  },
  {
    id: 'CSH-001',
    fullName: 'Tunde Okafor',
    email: 'cashier@akobi.com',
    password: 'cashier123',
    role: 'cashier',
    department: 'Cashier',
  },
  {
    id: 'NUR-001',
    fullName: 'Grace Nwosu',
    email: 'nurse@akobi.com',
    password: 'nurse123',
    role: 'nurse',
    department: 'Ward & Nursing',
  },
  {
    id: 'ACC-001',
    fullName: 'Ngozi Adeyemi',
    email: 'accountant@akobi.com',
    password: 'accounts123',
    role: 'accountant',
    department: 'Accounts',
  },
];

function getStoredStaff(): StaffPortalUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedValue = window.localStorage.getItem(STAFF_AUTH_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as StaffPortalUser;
  } catch {
    window.localStorage.removeItem(STAFF_AUTH_STORAGE_KEY);
    return null;
  }
}

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<StaffPortalUser | null>(() => getStoredStaff());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (currentStaff) {
      window.localStorage.setItem(STAFF_AUTH_STORAGE_KEY, JSON.stringify(currentStaff));
    } else {
      window.localStorage.removeItem(STAFF_AUTH_STORAGE_KEY);
    }
  }, [currentStaff]);

  const login = (email: string, password: string, role: StaffPortalRole): boolean => {
    const staffUser = mockStaffUsers.find(
      (user) => user.email === email && user.password === password && user.role === role,
    );

    if (!staffUser) {
      return false;
    }

    const { password: _, ...staffWithoutPassword } = staffUser;
    setCurrentStaff(staffWithoutPassword);
    return true;
  };

  const logout = () => {
    setCurrentStaff(null);
  };

  return (
    <StaffAuthContext.Provider
      value={{
        currentStaff,
        login,
        logout,
        isAuthenticated: !!currentStaff,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);

  if (context === undefined) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }

  return context;
}
