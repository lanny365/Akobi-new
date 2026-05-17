import { createContext, useContext, useState, ReactNode } from 'react';

interface EmergencyPatient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  emergencyType: string;
  severity: 'critical' | 'severe' | 'moderate';
  chiefComplaint: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    oxygenSaturation?: string;
  };
  timestamp: string;
  alertedAt: Date;
  alertedDoctors: string[];
}

interface EmergencyContextType {
  emergencyPatients: EmergencyPatient[];
  addEmergencyPatient: (patient: EmergencyPatient) => void;
  removeEmergencyPatient: (patientId: string) => void;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export function EmergencyProvider({ children }: { children: ReactNode }) {
  const [emergencyPatients, setEmergencyPatients] = useState<EmergencyPatient[]>([]);

  const addEmergencyPatient = (patient: EmergencyPatient) => {
    setEmergencyPatients(prev => [...prev, patient]);
  };

  const removeEmergencyPatient = (patientId: string) => {
    setEmergencyPatients(prev => prev.filter(p => p.id !== patientId));
  };

  return (
    <EmergencyContext.Provider value={{ emergencyPatients, addEmergencyPatient, removeEmergencyPatient }}>
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within EmergencyProvider');
  }
  return context;
}
