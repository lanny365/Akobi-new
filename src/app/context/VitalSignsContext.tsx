import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchVitalSignsQueue, type BackendVisit } from '../utils/api';

export interface VitalSignsPatient {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  assignedDoctor: string;
  appointmentTime: string;
  chiefComplaint: string;
  reasonToSeeDoctor?: 'Consultation' | 'Treatment';
  consultationType?: string;
  treatmentType?: string;
  status: 'pending' | 'completed' | 'sent-to-doctor';
  routedFrom?: string;
  routedBy?: string;
  routedAt?: string;
  vitalSigns?: {
    bloodPressure: string;
    temperature: string;
    pulse: string;
    respiratoryRate: string;
    weight: string;
    height: string;
    bmi?: string;
    oxygenSaturation: string;
    bloodSugar?: string;
    notes: string;
    recordedBy: string;
    recordedAt: string;
  };
  injectionRecord?: {
    medicationName: string;
    dosage: string;
    routeToDoctor: string;
    injectionSite: string;
    batchNumber: string;
    administeredBy: string;
    administeredAt: string;
    notes: string;
  };
}

interface VitalSignsContextType {
  vitalSignsQueue: VitalSignsPatient[];
  isLoading: boolean;
  addToVitalSignsQueue: (patient: VitalSignsPatient) => void;
  addMultipleToQueue: (patients: VitalSignsPatient[]) => void;
  updatePatientVitalSigns: (patientId: string, vitalSigns: VitalSignsPatient['vitalSigns']) => void;
  updatePatientInjection: (patientId: string, injectionRecord: VitalSignsPatient['injectionRecord']) => void;
  updatePatientStatus: (patientId: string, status: VitalSignsPatient['status']) => void;
  removeFromQueue: (patientId: string) => void;
  getPatientById: (patientId: string) => VitalSignsPatient | undefined;
  refreshQueue: () => Promise<void>;
}

const VitalSignsContext = createContext<VitalSignsContextType | undefined>(undefined);

export function VitalSignsProvider({ children }: { children: ReactNode }) {
  const [vitalSignsQueue, setVitalSignsQueue] = useState<VitalSignsPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateAge = (dateOfBirth?: string | null): number => {
    if (!dateOfBirth) {
      return 0;
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age;
  };

  const formatAppointmentTime = (queuedAt?: string | null): string => {
    if (!queuedAt) {
      return 'Walk-in';
    }

    return new Date(queuedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const mapVisitToQueuePatient = (visit: BackendVisit): VitalSignsPatient => ({
    id: String(visit.id),
    patientId: visit.patient.patient_number,
    patientName: visit.patient.full_name,
    age: calculateAge(visit.patient.date_of_birth),
    gender: visit.patient.gender,
    assignedDoctor: visit.doctor?.name || 'Doctor not assigned',
    appointmentTime: formatAppointmentTime(visit.queued_at),
    chiefComplaint: visit.chief_complaint,
    reasonToSeeDoctor:
      visit.reason_to_see_doctor === 'Treatment' ? 'Treatment' : 'Consultation',
    consultationType: visit.consultation_type || undefined,
    treatmentType: visit.treatment_type || undefined,
    status: visit.status === 'vitals-recorded' ? 'completed' : 'pending',
    routedFrom: visit.department?.name || 'Reception',
    routedBy: 'Reception Staff',
    routedAt: visit.queued_at || undefined,
  });

  const refreshQueue = async () => {
    setIsLoading(true);

    try {
      const queue = await fetchVitalSignsQueue();
      setVitalSignsQueue(queue.map(mapVisitToQueuePatient));
    } catch (error) {
      console.error('Failed to load vital signs queue', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshQueue();
  }, []);

  const addToVitalSignsQueue = (patient: VitalSignsPatient) => {
    setVitalSignsQueue(prev => {
      // Check if patient already exists
      const existingIndex = prev.findIndex(p => p.patientId === patient.patientId);
      if (existingIndex >= 0) {
        // Update existing patient
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...patient };
        return updated;
      }
      // Add new patient
      return [...prev, patient];
    });
  };

  const addMultipleToQueue = (patients: VitalSignsPatient[]) => {
    setVitalSignsQueue(prev => {
      const newQueue = [...prev];
      patients.forEach(patient => {
        const existingIndex = newQueue.findIndex(p => p.patientId === patient.patientId);
        if (existingIndex >= 0) {
          newQueue[existingIndex] = { ...newQueue[existingIndex], ...patient };
        } else {
          newQueue.push(patient);
        }
      });
      return newQueue;
    });
  };

  const updatePatientVitalSigns = (patientId: string, vitalSigns: VitalSignsPatient['vitalSigns']) => {
    setVitalSignsQueue(prev =>
      prev.map(p => p.patientId === patientId ? { ...p, vitalSigns } : p)
    );
  };

  const updatePatientInjection = (patientId: string, injectionRecord: VitalSignsPatient['injectionRecord']) => {
    setVitalSignsQueue(prev =>
      prev.map(p => p.patientId === patientId ? { ...p, injectionRecord } : p)
    );
  };

  const updatePatientStatus = (patientId: string, status: VitalSignsPatient['status']) => {
    setVitalSignsQueue(prev =>
      prev.map(p => p.patientId === patientId ? { ...p, status } : p)
    );
  };

  const removeFromQueue = (patientId: string) => {
    setVitalSignsQueue(prev => prev.filter(p => p.patientId !== patientId));
  };

  const getPatientById = (patientId: string) => {
    return vitalSignsQueue.find(p => p.patientId === patientId);
  };

  return (
    <VitalSignsContext.Provider
      value={{
        vitalSignsQueue,
        isLoading,
        addToVitalSignsQueue,
        addMultipleToQueue,
        updatePatientVitalSigns,
        updatePatientInjection,
        updatePatientStatus,
        removeFromQueue,
        getPatientById,
        refreshQueue,
      }}
    >
      {children}
    </VitalSignsContext.Provider>
  );
}

export function useVitalSigns() {
  const context = useContext(VitalSignsContext);
  if (context === undefined) {
    throw new Error('useVitalSigns must be used within a VitalSignsProvider');
  }
  return context;
}
