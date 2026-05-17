import { createContext, useContext, useState, ReactNode } from 'react';

interface LabTechnician {
  id: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
}

interface LabTechnicianAuthContextType {
  labTechnician: LabTechnician | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const LabTechnicianAuthContext = createContext<LabTechnicianAuthContextType | undefined>(undefined);

export function LabTechnicianAuthProvider({ children }: { children: ReactNode }) {
  const [labTechnician, setLabTechnician] = useState<LabTechnician | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate authentication
    // In production, this would call an API
    if (password.length >= 4) {
      const mockLabTechnician: LabTechnician = {
        id: 'LT-001',
        name: email.split('@')[0].split('.').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        email,
        specialization: 'Medical Laboratory Science',
        licenseNumber: 'MLT-2024-' + Math.floor(Math.random() * 10000),
      };
      setLabTechnician(mockLabTechnician);
      return true;
    }
    return false;
  };

  const logout = () => {
    setLabTechnician(null);
  };

  return (
    <LabTechnicianAuthContext.Provider
      value={{
        labTechnician,
        login,
        logout,
        isAuthenticated: !!labTechnician,
      }}
    >
      {children}
    </LabTechnicianAuthContext.Provider>
  );
}

export function useLabTechnicianAuth() {
  const context = useContext(LabTechnicianAuthContext);
  if (context === undefined) {
    throw new Error('useLabTechnicianAuth must be used within a LabTechnicianAuthProvider');
  }
  return context;
}
