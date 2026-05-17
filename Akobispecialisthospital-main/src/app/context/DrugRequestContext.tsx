import { createContext, useContext, useState, ReactNode } from 'react';

export interface DrugRequestItem {
  drugName: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  unitPrice: number;
  totalPrice: number;
}

export interface DrugRequest {
  id: string;
  requestNumber: string;
  requesterType: 'Doctor' | 'Surgeon' | 'Anesthetist';
  requesterName: string;
  requesterId: string;
  patientId: string;
  patientName: string;
  patientCardNumber: string;
  drugs: DrugRequestItem[];
  requestDate: string;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Dispensed';
  notes?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  dispensedBy?: string;
  dispensedDate?: string;
}

interface DrugRequestContextType {
  drugRequests: DrugRequest[];
  addDrugRequest: (request: Omit<DrugRequest, 'id' | 'requestNumber' | 'requestDate' | 'status'>) => string;
  approveDrugRequest: (requestId: string, approverName: string) => void;
  rejectDrugRequest: (requestId: string, rejectorName: string, reason: string) => void;
  dispenseDrugRequest: (requestId: string, dispenserName: string) => void;
  getPendingRequests: () => DrugRequest[];
  getRequestsByStatus: (status: DrugRequest['status']) => DrugRequest[];
  getRequestsByRequester: (requesterType: DrugRequest['requesterType']) => DrugRequest[];
}

const DrugRequestContext = createContext<DrugRequestContextType | undefined>(undefined);

export function DrugRequestProvider({ children }: { children: ReactNode }) {
  const [drugRequests, setDrugRequests] = useState<DrugRequest[]>([
    // Sample pending requests
    {
      id: 'DR001',
      requestNumber: 'DRQ-2026-001',
      requesterType: 'Doctor',
      requesterName: 'Dr. Sarah Johnson',
      requesterId: 'DOC001',
      patientId: 'P12345',
      patientName: 'John Doe',
      patientCardNumber: 'AKB-123456',
      drugs: [
        {
          drugName: 'Amoxicillin 500mg',
          quantity: 21,
          dosage: '500mg',
          frequency: 'Three times daily',
          duration: '7 days',
          unitPrice: 0.5,
          totalPrice: 10.5,
        },
        {
          drugName: 'Paracetamol 500mg',
          quantity: 30,
          dosage: '500mg',
          frequency: 'As needed for pain',
          duration: '10 days',
          unitPrice: 0.3,
          totalPrice: 9.0,
        },
      ],
      requestDate: '2026-04-26T09:30:00.000Z',
      priority: 'Normal',
      status: 'Pending',
      notes: 'Patient has respiratory infection',
    },
    {
      id: 'DR002',
      requestNumber: 'DRQ-2026-002',
      requesterType: 'Surgeon',
      requesterName: 'Dr. Michael Chen',
      requesterId: 'SUR001',
      patientId: 'P67890',
      patientName: 'Jane Smith',
      patientCardNumber: 'AKB-789012',
      drugs: [
        {
          drugName: 'Ceftriaxone 1g',
          quantity: 3,
          dosage: '1g',
          frequency: 'Once daily IV',
          duration: '3 days',
          unitPrice: 1.5,
          totalPrice: 4.5,
        },
        {
          drugName: 'Tramadol 50mg',
          quantity: 20,
          dosage: '50mg',
          frequency: 'Every 6 hours',
          duration: '5 days',
          unitPrice: 0.75,
          totalPrice: 15.0,
        },
      ],
      requestDate: '2026-04-26T10:15:00.000Z',
      priority: 'Urgent',
      status: 'Pending',
      notes: 'Post-operative care for appendectomy',
    },
    {
      id: 'DR003',
      requestNumber: 'DRQ-2026-003',
      requesterType: 'Anesthetist',
      requesterName: 'Dr. Emily Wong',
      requesterId: 'ANE001',
      patientId: 'P45678',
      patientName: 'Robert Williams',
      patientCardNumber: 'AKB-456789',
      drugs: [
        {
          drugName: 'Propofol 10mg/ml',
          quantity: 5,
          dosage: '10mg/ml',
          frequency: 'As needed for induction',
          duration: 'Single dose',
          unitPrice: 2.0,
          totalPrice: 10.0,
        },
        {
          drugName: 'Fentanyl 50mcg/ml',
          quantity: 2,
          dosage: '50mcg/ml',
          frequency: 'As needed',
          duration: 'Procedure duration',
          unitPrice: 1.0,
          totalPrice: 2.0,
        },
      ],
      requestDate: '2026-04-26T08:45:00.000Z',
      priority: 'Emergency',
      status: 'Pending',
      notes: 'Emergency surgery - fractured femur',
    },
  ]);

  const addDrugRequest = (
    request: Omit<DrugRequest, 'id' | 'requestNumber' | 'requestDate' | 'status'>
  ): string => {
    const newRequest: DrugRequest = {
      ...request,
      id: `DR${(drugRequests.length + 1).toString().padStart(3, '0')}`,
      requestNumber: `DRQ-${new Date().getFullYear()}-${(drugRequests.length + 1)
        .toString()
        .padStart(3, '0')}`,
      requestDate: new Date().toISOString(),
      status: 'Pending',
    };

    setDrugRequests([...drugRequests, newRequest]);
    return newRequest.id;
  };

  const approveDrugRequest = (requestId: string, approverName: string) => {
    setDrugRequests(
      drugRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: 'Approved' as const,
              approvedBy: approverName,
              approvedDate: new Date().toISOString(),
            }
          : request
      )
    );
  };

  const rejectDrugRequest = (requestId: string, rejectorName: string, reason: string) => {
    setDrugRequests(
      drugRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: 'Rejected' as const,
              rejectedBy: rejectorName,
              rejectedDate: new Date().toISOString(),
              rejectionReason: reason,
            }
          : request
      )
    );
  };

  const dispenseDrugRequest = (requestId: string, dispenserName: string) => {
    setDrugRequests(
      drugRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: 'Dispensed' as const,
              dispensedBy: dispenserName,
              dispensedDate: new Date().toISOString(),
            }
          : request
      )
    );
  };

  const getPendingRequests = () => {
    return drugRequests.filter((request) => request.status === 'Pending');
  };

  const getRequestsByStatus = (status: DrugRequest['status']) => {
    return drugRequests.filter((request) => request.status === status);
  };

  const getRequestsByRequester = (requesterType: DrugRequest['requesterType']) => {
    return drugRequests.filter((request) => request.requesterType === requesterType);
  };

  return (
    <DrugRequestContext.Provider
      value={{
        drugRequests,
        addDrugRequest,
        approveDrugRequest,
        rejectDrugRequest,
        dispenseDrugRequest,
        getPendingRequests,
        getRequestsByStatus,
        getRequestsByRequester,
      }}
    >
      {children}
    </DrugRequestContext.Provider>
  );
}

export function useDrugRequest() {
  const context = useContext(DrugRequestContext);
  if (!context) {
    throw new Error('useDrugRequest must be used within DrugRequestProvider');
  }
  return context;
}