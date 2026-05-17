import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  email: string;
  type: 'residential' | 'visiting-consultant' | 'medical-officer';
  department: string;
}

interface DoctorAuthContextType {
  currentDoctor: Doctor | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);
const DOCTOR_AUTH_STORAGE_KEY = 'akobi_doctor_auth';

function getStoredDoctor(): Doctor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedValue = window.localStorage.getItem(DOCTOR_AUTH_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as Doctor;
  } catch {
    window.localStorage.removeItem(DOCTOR_AUTH_STORAGE_KEY);
    return null;
  }
}

export function DoctorAuthProvider({ children }: { children: ReactNode }) {
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(() => getStoredDoctor());

  // Mock doctors database
  const mockDoctors: Array<Doctor & { password: string }> = [
    {
      id: 'DR-001',
      fullName: 'Dr. Sarah Johnson',
      specialization: 'Cardiology',
      email: 'sarah.johnson@akobi.com',
      password: 'doctor123',
      type: 'residential',
      department: 'Cardiology',
    },
    {
      id: 'DR-002',
      fullName: 'Dr. Michael Chen',
      specialization: 'General Medicine',
      email: 'michael.chen@akobi.com',
      password: 'doctor123',
      type: 'residential',
      department: 'Internal Medicine',
    },
    {
      id: 'DR-003',
      fullName: 'Dr. Fatima Ibrahim',
      specialization: 'Obstetrics & Gynecology',
      email: 'fatima.ibrahim@consultant.com',
      password: 'doctor123',
      type: 'visiting-consultant',
      department: 'Obstetrics & Gynecology',
    },
    {
      id: 'DR-004',
      fullName: 'Dr. Amina Yusuf',
      specialization: 'Pediatrics',
      email: 'amina.yusuf@akobi.com',
      password: 'doctor123',
      type: 'residential',
      department: 'Pediatrics',
    },
    {
      id: 'DR-005',
      fullName: 'Dr. James Okafor',
      specialization: 'Surgery',
      email: 'james.okafor@consultant.com',
      password: 'doctor123',
      type: 'visiting-consultant',
      department: 'Surgery',
    },
  ];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (currentDoctor) {
      window.localStorage.setItem(DOCTOR_AUTH_STORAGE_KEY, JSON.stringify(currentDoctor));
    } else {
      window.localStorage.removeItem(DOCTOR_AUTH_STORAGE_KEY);
    }
  }, [currentDoctor]);

  const login = (email: string, password: string): boolean => {
    const doctor = mockDoctors.find(
      (d) => d.email === email && d.password === password
    );

    if (doctor) {
      const { password: _, ...doctorWithoutPassword } = doctor;
      setCurrentDoctor(doctorWithoutPassword);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentDoctor(null);
  };

  return (
    <DoctorAuthContext.Provider
      value={{
        currentDoctor,
        login,
        logout,
        isAuthenticated: !!currentDoctor,
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  );
}

export function useDoctorAuth() {
  const context = useContext(DoctorAuthContext);
  if (context === undefined) {
    throw new Error('useDoctorAuth must be used within a DoctorAuthProvider');
  }
  return context;
}
