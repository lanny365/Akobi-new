import { createContext, ReactNode, useContext, useState } from 'react';

export type AdmissionPriority = 'routine' | 'urgent' | 'critical';
export type AdmissionStatus = 'pending-ward-assignment' | 'admitted';

export interface AdmissionRequestData {
  id: string;
  patientId: string;
  patientName: string;
  cardNumber?: string;
  age: number;
  gender: string;
  diagnosis: string;
  admissionReason: string;
  treatmentPlan: string;
  requestingDoctor: string;
  requestedAt: string;
  priority: AdmissionPriority;
  status: AdmissionStatus;
  ward?: string;
  bedNumber?: string;
  admissionDate?: string;
  admissionTime?: string;
  assignedByNurse?: string;
  wardAssignedAt?: string;
}

interface AdmissionContextType {
  admissionRequests: AdmissionRequestData[];
  admittedWardPatients: AdmissionRequestData[];
  initiateAdmission: (patient: {
    patientId: string;
    patientName: string;
    cardNumber?: string;
    age: number;
    gender: string;
    diagnosis: string;
    admissionReason: string;
    treatmentPlan: string;
    requestingDoctor: string;
    priority?: AdmissionPriority;
  }) => void;
  assignWardAdmission: (
    patientId: string,
    details: {
      ward: string;
      bedNumber: string;
      admissionDate: string;
      admissionTime: string;
      assignedByNurse: string;
    }
  ) => void;
  getPendingAdmissionRequests: () => AdmissionRequestData[];
}

const AdmissionContext = createContext<AdmissionContextType | undefined>(undefined);

export function AdmissionProvider({ children }: { children: ReactNode }) {
  const [admissionRequests, setAdmissionRequests] = useState<AdmissionRequestData[]>([]);

  const initiateAdmission = (patient: {
    patientId: string;
    patientName: string;
    cardNumber?: string;
    age: number;
    gender: string;
    diagnosis: string;
    admissionReason: string;
    treatmentPlan: string;
    requestingDoctor: string;
    priority?: AdmissionPriority;
  }) => {
    setAdmissionRequests((prev) => {
      const nextRequest: AdmissionRequestData = {
        id: patient.patientId,
        patientId: patient.patientId,
        patientName: patient.patientName,
        cardNumber: patient.cardNumber || patient.patientId,
        age: patient.age,
        gender: patient.gender,
        diagnosis: patient.diagnosis,
        admissionReason: patient.admissionReason,
        treatmentPlan: patient.treatmentPlan,
        requestingDoctor: patient.requestingDoctor,
        requestedAt: new Date().toISOString(),
        priority: patient.priority ?? 'routine',
        status: 'pending-ward-assignment',
      };

      const existingIndex = prev.findIndex((entry) => entry.patientId === patient.patientId);

      if (existingIndex === -1) {
        return [...prev, nextRequest];
      }

      return prev.map((entry, index) => (
        index === existingIndex
          ? { ...entry, ...nextRequest, status: 'pending-ward-assignment' as const }
          : entry
      ));
    });
  };

  const assignWardAdmission = (
    patientId: string,
    details: {
      ward: string;
      bedNumber: string;
      admissionDate: string;
      admissionTime: string;
      assignedByNurse: string;
    }
  ) => {
    setAdmissionRequests((prev) =>
      prev.map((patient) =>
        patient.patientId === patientId
          ? {
              ...patient,
              ward: details.ward,
              bedNumber: details.bedNumber,
              admissionDate: details.admissionDate,
              admissionTime: details.admissionTime,
              assignedByNurse: details.assignedByNurse,
              wardAssignedAt: new Date().toISOString(),
              status: 'admitted' as const,
            }
          : patient
      )
    );
  };

  const getPendingAdmissionRequests = () => {
    return admissionRequests.filter((patient) => patient.status === 'pending-ward-assignment');
  };

  const admittedWardPatients = admissionRequests.filter((patient) => patient.status === 'admitted');

  return (
    <AdmissionContext.Provider
      value={{
        admissionRequests,
        admittedWardPatients,
        initiateAdmission,
        assignWardAdmission,
        getPendingAdmissionRequests,
      }}
    >
      {children}
    </AdmissionContext.Provider>
  );
}

export function useAdmission() {
  const context = useContext(AdmissionContext);

  if (context === undefined) {
    throw new Error('useAdmission must be used within an AdmissionProvider');
  }

  return context;
}
