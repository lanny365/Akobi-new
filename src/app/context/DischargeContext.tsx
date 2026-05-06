import { createContext, useContext, useState, ReactNode } from 'react';

type DischargeStatus =
  | 'pending-nursing-review'
  | 'pending-payment-verification'
  | 'pending-final-discharge'
  | 'final-discharged';

export interface DischargedPatientData {
  id: string;
  patientId: string;
  patientName: string;
  cardNumber?: string;
  age?: number;
  gender?: string;
  admissionDate?: string;
  ward: string;
  bedNumber: string;
  daysAdmitted: number;
  diagnosis: string;
  attendingDoctor: string;
  totalCharges: number;
  dischargedBy: string;
  dischargeTime: string;
  dischargeDiagnosis: string;
  treatmentSummary: string;
  homeCareInstructions: string;
  prescriptionDetails: string;
  followUpRequired: boolean;
  followUpDate: string;
  followUpDoctor: string;
  nextOfKinNotified: boolean;
  medicationCollected: boolean;
  doctorInitiatedBy?: string;
  doctorInitiatedDate?: string;
  receptionNotes?: string;
  receptionVerifiedBy?: string;
  receptionVerifiedAt?: string;
  finalDischargedBy?: string;
  nurseDischargeDate: string;
  status: DischargeStatus;
}

interface DischargeContextType {
  nurseDischargedPatients: DischargedPatientData[];
  initiateDischarge: (patient: {
    patientId: string;
    patientName: string;
    cardNumber?: string;
    age?: number;
    gender?: string;
    admissionDate?: string;
    ward: string;
    diagnosis: string;
    treatment: string;
    dischargedBy: string;
    dischargeDate: string;
    status?: DischargeStatus;
  }) => void;
  addNurseDischarge: (patient: DischargedPatientData) => void;
  markPaymentVerified: (patientId: string) => void;
  completeFinalDischarge: (patientId: string, receptionNotes: string, dischargedBy: string) => void;
  getPendingNursingReview: () => DischargedPatientData[];
  getPendingDischarges: () => DischargedPatientData[];
}

const DischargeContext = createContext<DischargeContextType | undefined>(undefined);

export function DischargeProvider({ children }: { children: ReactNode }) {
  const [nurseDischargedPatients, setNurseDischargedPatients] = useState<DischargedPatientData[]>([]);

  const initiateDischarge = (patient: {
    patientId: string;
    patientName: string;
    cardNumber?: string;
    age?: number;
    gender?: string;
    admissionDate?: string;
    ward: string;
    diagnosis: string;
    treatment: string;
    dischargedBy: string;
    dischargeDate: string;
    status?: DischargeStatus;
  }) => {
    setNurseDischargedPatients((prev) => {
      const nextPatient: DischargedPatientData = {
        id: patient.patientId,
        patientId: patient.patientId,
        patientName: patient.patientName,
        cardNumber: patient.cardNumber || patient.patientId,
        age: patient.age,
        gender: patient.gender,
        admissionDate: patient.admissionDate,
        ward: patient.ward,
        bedNumber: 'N/A',
        daysAdmitted: 0,
        diagnosis: patient.diagnosis,
        attendingDoctor: patient.dischargedBy,
        totalCharges: 0,
        dischargedBy: patient.dischargedBy,
        dischargeTime: new Date(patient.dischargeDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dischargeDiagnosis: patient.diagnosis,
        treatmentSummary: patient.treatment || 'Doctor initiated discharge review',
        homeCareInstructions: '',
        prescriptionDetails: '',
        followUpRequired: false,
        followUpDate: '',
        followUpDoctor: '',
        nextOfKinNotified: false,
        medicationCollected: false,
        doctorInitiatedBy: patient.dischargedBy,
        doctorInitiatedDate: patient.dischargeDate,
        nurseDischargeDate: '',
        status: patient.status ?? 'pending-nursing-review',
      };

      const existingIndex = prev.findIndex((entry) => entry.patientId === patient.patientId);

      if (existingIndex === -1) {
        return [...prev, nextPatient];
      }

      return prev.map((entry, index) => (
        index === existingIndex
          ? { ...entry, ...nextPatient, status: nextPatient.status }
          : entry
      ));
    });
  };

  const addNurseDischarge = (patient: DischargedPatientData) => {
    setNurseDischargedPatients((prev) => {
      const nextPatient = {
        ...patient,
        status: patient.status ?? ('pending-payment-verification' as const)
      };
      const existingIndex = prev.findIndex((entry) => entry.patientId === patient.patientId);

      if (existingIndex === -1) {
        return [...prev, nextPatient];
      }

      return prev.map((entry, index) => (
        index === existingIndex
          ? { ...entry, ...nextPatient, status: nextPatient.status }
          : entry
      ));
    });
  };

  const markPaymentVerified = (patientId: string) => {
    setNurseDischargedPatients((prev) =>
      prev.map((patient) =>
        patient.patientId === patientId
          ? {
              ...patient,
              status: 'pending-final-discharge' as const,
              receptionVerifiedAt: new Date().toISOString(),
            }
          : patient
      )
    );
  };

  const completeFinalDischarge = (patientId: string, receptionNotes: string, dischargedBy: string) => {
    setNurseDischargedPatients((prev) =>
      prev.map((patient) =>
        patient.patientId === patientId
          ? {
              ...patient,
              status: 'final-discharged' as const,
              receptionNotes,
              finalDischargedBy: dischargedBy,
            }
          : patient
      )
    );
  };

  const getPendingNursingReview = () => {
    return nurseDischargedPatients.filter((p) => p.status === 'pending-nursing-review');
  };

  const getPendingDischarges = () => {
    return nurseDischargedPatients.filter(
      (p) => p.status === 'pending-payment-verification' || p.status === 'pending-final-discharge'
    );
  };

  return (
    <DischargeContext.Provider
      value={{
        nurseDischargedPatients,
        initiateDischarge,
        addNurseDischarge,
        markPaymentVerified,
        completeFinalDischarge,
        getPendingNursingReview,
        getPendingDischarges,
      }}
    >
      {children}
    </DischargeContext.Provider>
  );
}

export function useDischarge() {
  const context = useContext(DischargeContext);
  if (context === undefined) {
    throw new Error('useDischarge must be used within a DischargeProvider');
  }
  return context;
}
