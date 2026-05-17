import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface TheatreStaffMember {
  id: string;
  fullName: string;
  role: 'surgeon' | 'anesthetist';
  specialization: string;
  username: string;
  licenseNumber: string;
}

interface TheatreAuthContextType {
  currentStaff: TheatreStaffMember | null;
  login: (username: string, password: string, role: 'surgeon' | 'anesthetist') => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const TheatreAuthContext = createContext<TheatreAuthContextType | undefined>(undefined);
const THEATRE_AUTH_STORAGE_KEY = 'akobi_theatre_auth';

function getStoredTheatreStaff(): TheatreStaffMember | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedValue = window.localStorage.getItem(THEATRE_AUTH_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as TheatreStaffMember;
  } catch {
    window.localStorage.removeItem(THEATRE_AUTH_STORAGE_KEY);
    return null;
  }
}

export function TheatreAuthProvider({ children }: { children: ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<TheatreStaffMember | null>(() => getStoredTheatreStaff());

  // Mock theatre staff database
  const mockStaff: Array<TheatreStaffMember & { password: string }> = [
    // Surgeons
    {
      id: 'SUR-001',
      fullName: 'Dr. Sarah Johnson',
      role: 'surgeon',
      specialization: 'General Surgery',
      username: 'surgeon1',
      password: 'surgeon123',
      licenseNumber: 'SG-2019-0345',
    },
    {
      id: 'SUR-002',
      fullName: 'Dr. James Okafor',
      role: 'surgeon',
      specialization: 'Orthopedic Surgery',
      username: 'surgeon2',
      password: 'surgeon123',
      licenseNumber: 'SG-2018-0892',
    },
    {
      id: 'SUR-003',
      fullName: 'Dr. Amina Hassan',
      role: 'surgeon',
      specialization: 'Neurosurgery',
      username: 'surgeon3',
      password: 'surgeon123',
      licenseNumber: 'SG-2020-1234',
    },
    // Anesthetists
    {
      id: 'ANE-001',
      fullName: 'Dr. Michael Chen',
      role: 'anesthetist',
      specialization: 'Anesthesiology',
      username: 'anesthetist1',
      password: 'anesthetist123',
      licenseNumber: 'AN-2019-0567',
    },
    {
      id: 'ANE-002',
      fullName: 'Dr. Fatima Ibrahim',
      role: 'anesthetist',
      specialization: 'Cardiac Anesthesiology',
      username: 'anesthetist2',
      password: 'anesthetist123',
      licenseNumber: 'AN-2018-0234',
    },
    {
      id: 'ANE-003',
      fullName: 'Dr. David Williams',
      role: 'anesthetist',
      specialization: 'Pediatric Anesthesiology',
      username: 'anesthetist3',
      password: 'anesthetist123',
      licenseNumber: 'AN-2020-0789',
    },
  ];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (currentStaff) {
      window.localStorage.setItem(THEATRE_AUTH_STORAGE_KEY, JSON.stringify(currentStaff));
    } else {
      window.localStorage.removeItem(THEATRE_AUTH_STORAGE_KEY);
    }
  }, [currentStaff]);

  const login = (username: string, password: string, role: 'surgeon' | 'anesthetist'): boolean => {
    const staff = mockStaff.find(
      (s) => s.username === username && s.password === password && s.role === role
    );

    if (staff) {
      const { password: _, ...staffWithoutPassword } = staff;
      setCurrentStaff(staffWithoutPassword);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentStaff(null);
  };

  return (
    <TheatreAuthContext.Provider
      value={{
        currentStaff,
        login,
        logout,
        isAuthenticated: !!currentStaff,
      }}
    >
      {children}
    </TheatreAuthContext.Provider>
  );
}

export function useTheatreAuth() {
  const context = useContext(TheatreAuthContext);
  if (context === undefined) {
    throw new Error('useTheatreAuth must be used within a TheatreAuthProvider');
  }
  return context;
}
