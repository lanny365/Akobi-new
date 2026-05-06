import { createContext, useContext, useState, ReactNode } from 'react';

export interface PatientQueueItem {
  id: string;
  patientId: string;
  patientName: string;
  cardNumber: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  assignedDoctor: string;
  assignedDoctorId?: string;
  department: string;
  consultingRoom: string;
  appointmentTime: string;
  status: 'pending' | 'in-progress' | 'completed';
  routedAt: string;
  routedBy: string;
  isNewPatient?: boolean;
  registrationFee?: number;
  vitalSigns: {
    bp: string;
    temp: string;
    pulse: string;
    weight: string;
    height?: string;
    bmi?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
    bloodSugar?: string;
    notes?: string;
  };
  injectionRecord?: {
    medicationName: string;
    dosage: string;
    route: string;
    site: string;
    batchNumber: string;
    notes: string;
  };
}

interface PatientQueueContextType {
  patientQueue: PatientQueueItem[];
  addToQueue: (patient: PatientQueueItem) => void;
  updatePatientStatus: (patientId: string, status: 'pending' | 'in-progress' | 'completed') => void;
  getQueueForDoctor: (doctorName: string) => PatientQueueItem[];
  removeFromQueue: (patientId: string) => void;
}

const PatientQueueContext = createContext<PatientQueueContextType | undefined>(undefined);

export function PatientQueueProvider({ children }: { children: ReactNode }) {
  const [patientQueue, setPatientQueue] = useState<PatientQueueItem[]>([]);

  const addToQueue = (patient: PatientQueueItem) => {
    setPatientQueue(prev => {
      // Check if patient already exists in queue
      const existingIndex = prev.findIndex(p => p.patientId === patient.patientId);
      if (existingIndex >= 0) {
        // Update existing patient
        const updated = [...prev];
        updated[existingIndex] = patient;
        return updated;
      }
      // Add new patient to queue
      return [...prev, patient];
    });
  };

  const updatePatientStatus = (patientId: string, status: 'pending' | 'in-progress' | 'completed') => {
    setPatientQueue(prev =>
      prev.map(p => p.patientId === patientId ? { ...p, status } : p)
    );
  };

  const getQueueForDoctor = (doctorName: string) => {
    return patientQueue.filter(p => p.assignedDoctor === doctorName);
  };

  const removeFromQueue = (patientId: string) => {
    setPatientQueue(prev => prev.filter(p => p.patientId !== patientId));
  };

  return (
    <PatientQueueContext.Provider
      value={{
        patientQueue,
        addToQueue,
        updatePatientStatus,
        getQueueForDoctor,
        removeFromQueue,
      }}
    >
      {children}
    </PatientQueueContext.Provider>
  );
}

export function usePatientQueue() {
  const context = useContext(PatientQueueContext);
  if (context === undefined) {
    throw new Error('usePatientQueue must be used within a PatientQueueProvider');
  }
  return context;
}