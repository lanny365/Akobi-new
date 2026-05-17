import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchDoctorQueue, updateVisitStatus, type BackendVisit } from '../utils/api';

export interface PatientQueueItem {
  id: string;
  visitId: number;
  patientId: string;
  patientName: string;
  cardNumber: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  assignedDoctor: string;
  assignedDoctorId?: number;
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
  updatePatientStatus: (
    patientId: string,
    status: 'pending' | 'in-progress' | 'completed',
  ) => Promise<void>;
  getQueueForDoctor: (doctorName: string) => PatientQueueItem[];
  removeFromQueue: (patientId: string) => Promise<void>;
  refreshQueue: () => Promise<void>;
}

const PatientQueueContext = createContext<PatientQueueContextType | undefined>(undefined);

function calculateAge(dateOfBirth?: string | null): number {
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
}

function formatAppointmentTime(value?: string | null): string {
  if (!value) {
    return 'Walk-in';
  }

  return new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapVisitToQueueItem(visit: BackendVisit): PatientQueueItem {
  return {
    id: String(visit.id),
    visitId: visit.id,
    patientId: visit.patient.patient_number,
    patientName: visit.patient.full_name,
    cardNumber: visit.patient.card?.card_number || visit.patient.patient_number,
    age: calculateAge(visit.patient.date_of_birth),
    gender: visit.patient.gender,
    chiefComplaint: visit.chief_complaint,
    assignedDoctor: visit.doctor?.name || 'Doctor not assigned',
    assignedDoctorId: visit.doctor?.id,
    department: visit.department?.name || 'General',
    consultingRoom: visit.consulting_room || 'Pending room assignment',
    appointmentTime: formatAppointmentTime(visit.routed_to_doctor_at || visit.queued_at),
    status: visit.status === 'in-progress' ? 'in-progress' : visit.status === 'completed' ? 'completed' : 'pending',
    routedAt: visit.routed_to_doctor_at || visit.queued_at || new Date().toISOString(),
    routedBy: visit.routed_by || 'Vital Signs Unit',
    vitalSigns: {
      bp: visit.vital_sign?.blood_pressure || '',
      temp: String(visit.vital_sign?.temperature ?? ''),
      pulse: String(visit.vital_sign?.pulse ?? ''),
      weight: String(visit.vital_sign?.weight ?? ''),
      height:
        visit.vital_sign?.height === null || visit.vital_sign?.height === undefined
          ? undefined
          : String(visit.vital_sign.height),
      bmi:
        visit.vital_sign?.bmi === null || visit.vital_sign?.bmi === undefined
          ? undefined
          : String(visit.vital_sign.bmi),
      respiratoryRate:
        visit.vital_sign?.respiratory_rate === null || visit.vital_sign?.respiratory_rate === undefined
          ? undefined
          : String(visit.vital_sign.respiratory_rate),
      oxygenSaturation:
        visit.vital_sign?.oxygen_saturation === null || visit.vital_sign?.oxygen_saturation === undefined
          ? undefined
          : String(visit.vital_sign.oxygen_saturation),
      bloodSugar:
        visit.vital_sign?.blood_sugar === null || visit.vital_sign?.blood_sugar === undefined
          ? undefined
          : String(visit.vital_sign.blood_sugar),
      notes: visit.vital_sign?.notes || undefined,
    },
  };
}

export function PatientQueueProvider({ children }: { children: ReactNode }) {
  const [patientQueue, setPatientQueue] = useState<PatientQueueItem[]>([]);

  const refreshQueue = async () => {
    try {
      const queue = await fetchDoctorQueue();
      setPatientQueue(queue.map(mapVisitToQueueItem));
    } catch (error) {
      console.error('Failed to load doctor queue', error);
    }
  };

  useEffect(() => {
    void refreshQueue();
  }, []);

  const addToQueue = (patient: PatientQueueItem) => {
    setPatientQueue((prev) => {
      const existingIndex = prev.findIndex((item) => item.patientId === patient.patientId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = patient;
        return updated;
      }

      return [...prev, patient];
    });
  };

  const updatePatientStatus = async (
    patientId: string,
    status: 'pending' | 'in-progress' | 'completed',
  ) => {
    const patient = patientQueue.find((item) => item.patientId === patientId);
    if (!patient) {
      return;
    }

    setPatientQueue((prev) =>
      prev.map((item) => (item.patientId === patientId ? { ...item, status } : item)),
    );

    const backendStatus =
      status === 'pending'
        ? 'with-doctor'
        : status === 'in-progress'
          ? 'in-progress'
          : 'completed';

    await updateVisitStatus(patient.visitId, { status: backendStatus });
    await refreshQueue();
  };

  const getQueueForDoctor = (doctorName: string) => {
    return patientQueue.filter((item) => item.assignedDoctor === doctorName);
  };

  const removeFromQueue = async (patientId: string) => {
    const patient = patientQueue.find((item) => item.patientId === patientId);
    if (!patient) {
      return;
    }

    setPatientQueue((prev) => prev.filter((item) => item.patientId !== patientId));
    await updateVisitStatus(patient.visitId, { status: 'completed' });
    await refreshQueue();
  };

  return (
    <PatientQueueContext.Provider
      value={{
        patientQueue,
        addToQueue,
        updatePatientStatus,
        getQueueForDoctor,
        removeFromQueue,
        refreshQueue,
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
