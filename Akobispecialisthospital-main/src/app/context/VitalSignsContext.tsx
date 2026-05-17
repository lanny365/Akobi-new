import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  fetchVitalSignsQueue,
  recordVisitVitalSigns,
  routeVisitToDoctor,
  updateVisitStatus,
  type BackendVisit,
} from '../utils/api';

export interface VitalSignsPatient {
  id: string;
  visitId: number;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  assignedDoctor: string;
  assignedDoctorId?: number;
  appointmentTime: string;
  chiefComplaint: string;
  reasonToSeeDoctor?: 'Consultation' | 'Treatment';
  consultationType?: string;
  treatmentType?: string;
  department?: string;
  consultingRoom?: string;
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
  updatePatientVitalSigns: (
    patientId: string,
    vitalSigns: VitalSignsPatient['vitalSigns'],
  ) => Promise<void>;
  updatePatientInjection: (
    patientId: string,
    injectionRecord: VitalSignsPatient['injectionRecord'],
  ) => void;
  updatePatientStatus: (
    patientId: string,
    status: VitalSignsPatient['status'],
  ) => Promise<void>;
  updatePatientRouting: (
    patientId: string,
    routing: Pick<
      VitalSignsPatient,
      'assignedDoctor' | 'assignedDoctorId' | 'status' | 'routedBy' | 'routedAt' | 'consultingRoom'
    >,
    routeNotes?: string,
  ) => Promise<void>;
  removeFromQueue: (patientId: string) => void;
  getPatientById: (patientId: string) => VitalSignsPatient | undefined;
  refreshQueue: () => Promise<void>;
}

const VitalSignsContext = createContext<VitalSignsContextType | undefined>(undefined);

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

function formatAppointmentTime(queuedAt?: string | null): string {
  if (!queuedAt) {
    return 'Walk-in';
  }

  return new Date(queuedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapVisitToVitalSigns(visit: BackendVisit): VitalSignsPatient {
  return {
    id: String(visit.id),
    visitId: visit.id,
    patientId: visit.patient.patient_number,
    patientName: visit.patient.full_name,
    age: calculateAge(visit.patient.date_of_birth),
    gender: visit.patient.gender,
    assignedDoctor: visit.doctor?.name || 'Doctor not assigned',
    assignedDoctorId: visit.doctor?.id,
    appointmentTime: formatAppointmentTime(visit.queued_at),
    chiefComplaint: visit.chief_complaint,
    reasonToSeeDoctor:
      visit.reason_to_see_doctor === 'Treatment' ? 'Treatment' : 'Consultation',
    consultationType: visit.consultation_type || undefined,
    treatmentType: visit.treatment_type || undefined,
    department: visit.department?.name || undefined,
    consultingRoom: visit.consulting_room || undefined,
    status:
      visit.status === 'with-doctor'
        ? 'sent-to-doctor'
        : visit.status === 'vitals-recorded'
          ? 'completed'
          : 'pending',
    routedFrom: visit.department?.name || 'Reception',
    routedBy: visit.routed_by || 'Reception Staff',
    routedAt: visit.routed_to_doctor_at || visit.queued_at || undefined,
    vitalSigns: visit.vital_sign
      ? {
          bloodPressure: visit.vital_sign.blood_pressure || '',
          temperature: String(visit.vital_sign.temperature ?? ''),
          pulse: String(visit.vital_sign.pulse ?? ''),
          respiratoryRate: String(visit.vital_sign.respiratory_rate ?? ''),
          weight: String(visit.vital_sign.weight ?? ''),
          height: String(visit.vital_sign.height ?? ''),
          bmi:
            visit.vital_sign.bmi === null || visit.vital_sign.bmi === undefined
              ? undefined
              : String(visit.vital_sign.bmi),
          oxygenSaturation: String(visit.vital_sign.oxygen_saturation ?? ''),
          bloodSugar:
            visit.vital_sign.blood_sugar === null || visit.vital_sign.blood_sugar === undefined
              ? undefined
              : String(visit.vital_sign.blood_sugar),
          notes: visit.vital_sign.notes || '',
          recordedBy: visit.doctor?.name || 'Hospital Staff',
          recordedAt: visit.vital_sign.recorded_at || '',
        }
      : undefined,
  };
}

export function VitalSignsProvider({ children }: { children: ReactNode }) {
  const [vitalSignsQueue, setVitalSignsQueue] = useState<VitalSignsPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshQueue = async () => {
    setIsLoading(true);

    try {
      const queue = await fetchVitalSignsQueue();
      setVitalSignsQueue(queue.map(mapVisitToVitalSigns));
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
    setVitalSignsQueue((prev) => {
      const existingIndex = prev.findIndex((item) => item.patientId === patient.patientId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...patient };
        return updated;
      }

      return [...prev, patient];
    });
  };

  const addMultipleToQueue = (patients: VitalSignsPatient[]) => {
    setVitalSignsQueue((prev) => {
      const nextQueue = [...prev];
      patients.forEach((patient) => {
        const existingIndex = nextQueue.findIndex((item) => item.patientId === patient.patientId);
        if (existingIndex >= 0) {
          nextQueue[existingIndex] = { ...nextQueue[existingIndex], ...patient };
        } else {
          nextQueue.push(patient);
        }
      });
      return nextQueue;
    });
  };

  const updatePatientVitalSigns = async (
    patientId: string,
    vitalSigns: VitalSignsPatient['vitalSigns'],
  ) => {
    const patient = vitalSignsQueue.find((item) => item.patientId === patientId);
    if (!patient || !vitalSigns) {
      return;
    }

    setVitalSignsQueue((prev) =>
      prev.map((item) =>
        item.patientId === patientId
          ? { ...item, vitalSigns, status: 'completed' }
          : item,
      ),
    );

    await recordVisitVitalSigns(patient.visitId, {
      blood_pressure: vitalSigns.bloodPressure,
      temperature: vitalSigns.temperature,
      pulse: vitalSigns.pulse,
      respiratory_rate: vitalSigns.respiratoryRate,
      weight: vitalSigns.weight,
      height: vitalSigns.height,
      bmi: vitalSigns.bmi,
      oxygen_saturation: vitalSigns.oxygenSaturation,
      blood_sugar: vitalSigns.bloodSugar,
      notes: vitalSigns.notes,
      recorded_at: vitalSigns.recordedAt,
    });

    await refreshQueue();
  };

  const updatePatientInjection = (
    patientId: string,
    injectionRecord: VitalSignsPatient['injectionRecord'],
  ) => {
    setVitalSignsQueue((prev) =>
      prev.map((item) =>
        item.patientId === patientId ? { ...item, injectionRecord } : item,
      ),
    );
  };

  const updatePatientStatus = async (
    patientId: string,
    status: VitalSignsPatient['status'],
  ) => {
    const patient = vitalSignsQueue.find((item) => item.patientId === patientId);
    if (!patient) {
      return;
    }

    setVitalSignsQueue((prev) =>
      prev.map((item) => (item.patientId === patientId ? { ...item, status } : item)),
    );

    const backendStatus =
      status === 'sent-to-doctor'
        ? 'with-doctor'
        : status === 'completed'
          ? 'vitals-recorded'
          : 'queued';

    await updateVisitStatus(patient.visitId, {
      status: backendStatus,
    });

    await refreshQueue();
  };

  const updatePatientRouting = async (
    patientId: string,
    routing: Pick<
      VitalSignsPatient,
      'assignedDoctor' | 'assignedDoctorId' | 'status' | 'routedBy' | 'routedAt' | 'consultingRoom'
    >,
    routeNotes?: string,
  ) => {
    const patient = vitalSignsQueue.find((item) => item.patientId === patientId);
    if (!patient || !routing.assignedDoctorId) {
      return;
    }

    setVitalSignsQueue((prev) =>
      prev.map((item) =>
        item.patientId === patientId
          ? {
              ...item,
              assignedDoctor: routing.assignedDoctor,
              assignedDoctorId: routing.assignedDoctorId,
              status: routing.status,
              routedBy: routing.routedBy,
              routedAt: routing.routedAt,
              consultingRoom: routing.consultingRoom,
            }
          : item,
      ),
    );

    await routeVisitToDoctor(patient.visitId, {
      doctor_id: routing.assignedDoctorId,
      consulting_room: routing.consultingRoom,
      route_notes: routeNotes,
      routed_by: routing.routedBy,
      routed_to_doctor_at: routing.routedAt,
    });

    await refreshQueue();
  };

  const removeFromQueue = (patientId: string) => {
    setVitalSignsQueue((prev) => prev.filter((item) => item.patientId !== patientId));
  };

  const getPatientById = (patientId: string) => {
    return vitalSignsQueue.find((item) => item.patientId === patientId);
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
        updatePatientRouting,
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
