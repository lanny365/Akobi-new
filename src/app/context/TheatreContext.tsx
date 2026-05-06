import { createContext, useContext, useState, ReactNode } from 'react';

export interface PreOpMedication {
  id: string;
  name: string;
  type: 'medication' | 'drip';
  dosage: string;
  route: string;
  frequency: string;
  prescribedBy: string;
  prescribedDate: string;
  administered: boolean;
  administeredBy?: string;
  administeredDate?: string;
}

export interface LabTestResult {
  id: string;
  testName: string;
  category: string;
  result?: string;
  normalRange?: string;
  status: 'pending' | 'completed';
  price: number;
  orderedBy: string;
  orderedDate: string;
  completedDate?: string;
  performedBy?: string;
}

export interface TheatreNote {
  id: string;
  patientId: string;
  patientName: string;
  cardNumber: string;
  age: number;
  gender: string;
  requestingDoctor: string;
  dateRequested: string;
  preOpDiagnosis: string;
  plannedSurgery: string;
  indication: string;
  urgencyLevel: 'elective' | 'urgent' | 'emergency';
  anesthesiaType: string;
  estimatedDuration: string; // Now in hours from dropdown
  specialEquipment: string | string[]; // Can be array or comma-separated string for backward compatibility
  preparationNotes: string;
  surgeonInCharge: string; // Changed from surgeonPreference
  vitalSigns?: {
    bp: string;
    temp: string;
    pulse: string;
    weight: string;
  };
  status: 'pending' | 'scheduled' | 'pre-op' | 'in-progress' | 'post-op' | 'completed' | 'cancelled';
  scheduledDate?: string;
  scheduledTime?: string;
  theatreRoom?: string;
  assignedSurgeon?: string;
  assignedNurses?: string[];
  preOpMedications?: PreOpMedication[];
  labTests?: LabTestResult[];
  routedTo?: 'anesthetist' | 'ward' | 'morgue' | null;
  routedDate?: string;
  routedBy?: string;
}

interface TheatreContextType {
  theatreNotes: TheatreNote[];
  addTheatreNote: (note: Omit<TheatreNote, 'id' | 'dateRequested' | 'status'>) => void;
  updateTheatreNote: (id: string, updates: Partial<TheatreNote>) => void;
  getTheatreNote: (id: string) => TheatreNote | undefined;
  getPendingNotes: () => TheatreNote[];
  getScheduledNotes: () => TheatreNote[];
}

const TheatreContext = createContext<TheatreContextType | undefined>(undefined);

export function TheatreProvider({ children }: { children: ReactNode }) {
  const [theatreNotes, setTheatreNotes] = useState<TheatreNote[]>([
    // Sample data
    {
      id: 'TN-001',
      patientId: 'P-2026-0001',
      patientName: 'James Anderson',
      cardNumber: 'PT-2026-0001',
      age: 45,
      gender: 'Male',
      requestingDoctor: 'Dr. Michael Chen',
      dateRequested: '2026-04-20T08:30:00',
      preOpDiagnosis: 'Acute Appendicitis',
      plannedSurgery: 'Laparoscopic Appendectomy',
      indication: 'Patient presents with acute right lower quadrant pain, positive McBurney\'s point tenderness, elevated WBC count indicating acute appendicitis requiring surgical intervention.',
      urgencyLevel: 'urgent',
      anesthesiaType: 'general',
      estimatedDuration: '1-2 hours',
      specialEquipment: 'Laparoscopic equipment, endoscopic camera system',
      preparationNotes: 'NPO since midnight, IV access established, prophylactic antibiotics to be administered 30 minutes pre-op',
      surgeonInCharge: 'Dr. Sarah Johnson',
      vitalSigns: {
        bp: '130/85',
        temp: '38.2°C',
        pulse: '92',
        weight: '75kg'
      },
      status: 'scheduled',
      scheduledDate: '2026-04-21',
      scheduledTime: '14:00',
      theatreRoom: 'Theatre 1',
      assignedSurgeon: 'Dr. Sarah Johnson',
      assignedNurses: ['Nurse Mary', 'Nurse John'],
      labTests: [
        {
          id: 'LAB-001',
          testName: 'Complete Blood Count (CBC)',
          category: 'Hematology',
          result: 'WBC: 15,000/μL (elevated)',
          normalRange: 'WBC: 4,000-11,000/μL',
          status: 'completed',
          price: 3500,
          orderedBy: 'Dr. Michael Chen',
          orderedDate: '2026-04-20',
          completedDate: '2026-04-20',
          performedBy: 'Lab Technician Sarah'
        },
        {
          id: 'LAB-002',
          testName: 'Blood Typing',
          category: 'Serology',
          result: 'A+',
          normalRange: 'N/A',
          status: 'completed',
          price: 2000,
          orderedBy: 'Dr. Michael Chen',
          orderedDate: '2026-04-20',
          completedDate: '2026-04-20',
          performedBy: 'Lab Technician John'
        }
      ]
    },
    {
      id: 'TN-002',
      patientId: 'P-2026-0002',
      patientName: 'Grace Okonkwo',
      cardNumber: 'PT-2026-0002',
      age: 28,
      gender: 'Female',
      requestingDoctor: 'Dr. Sarah Johnson',
      dateRequested: '2026-04-21T06:00:00',
      preOpDiagnosis: 'Cephalopelvic Disproportion, Fetal Distress',
      plannedSurgery: 'Emergency Cesarean Section',
      indication: 'Failed progression of labor after 18 hours, fetal heart rate showing signs of distress. Immediate surgical delivery required.',
      urgencyLevel: 'emergency',
      anesthesiaType: 'spinal',
      estimatedDuration: '45-60 minutes',
      specialEquipment: 'Standard C-section tray, neonatal resuscitation equipment',
      preparationNotes: 'Patient prepped and draped, foley catheter inserted, anesthesia team on standby, pediatric team notified',
      surgeonInCharge: 'Dr. Michael Chen',
      vitalSigns: {
        bp: '140/90',
        temp: '37.1°C',
        pulse: '105',
        weight: '82kg'
      },
      status: 'in-progress',
      scheduledDate: '2026-04-21',
      scheduledTime: '10:00',
      theatreRoom: 'Theatre 2',
      assignedSurgeon: 'Dr. Michael Chen',
      assignedNurses: ['Nurse Lisa', 'Nurse Peter']
    },
    {
      id: 'TN-003',
      patientId: 'P-2025-1234',
      patientName: 'Mohammed Ibrahim',
      cardNumber: 'PT-2025-1234',
      age: 52,
      gender: 'Male',
      requestingDoctor: 'Dr. Michael Chen',
      dateRequested: '2026-04-19T14:20:00',
      preOpDiagnosis: 'Inguinal Hernia (Reducible)',
      plannedSurgery: 'Inguinal Hernia Repair (Lichtenstein Technique)',
      indication: 'Symptomatic right inguinal hernia causing discomfort and risk of incarceration. Elective surgical repair indicated.',
      urgencyLevel: 'elective',
      anesthesiaType: 'spinal',
      estimatedDuration: '2 hours',
      specialEquipment: 'Mesh for hernia repair, standard surgical tray',
      preparationNotes: 'Pre-operative assessment completed, consent signed, bowel preparation done, nil by mouth for 8 hours',
      surgeonInCharge: 'Dr. Sarah Johnson',
      vitalSigns: {
        bp: '125/78',
        temp: '36.8°C',
        pulse: '72',
        weight: '68kg'
      },
      status: 'completed',
      scheduledDate: '2026-04-20',
      scheduledTime: '09:00',
      theatreRoom: 'Theatre 1',
      assignedSurgeon: 'Dr. Sarah Johnson',
      assignedNurses: ['Nurse Emma', 'Nurse David']
    }
  ]);

  const addTheatreNote = (note: Omit<TheatreNote, 'id' | 'dateRequested' | 'status'>) => {
    const newNote: TheatreNote = {
      ...note,
      id: `TN-${String(theatreNotes.length + 1).padStart(3, '0')}`,
      dateRequested: new Date().toISOString(),
      status: 'pending'
    };
    setTheatreNotes([...theatreNotes, newNote]);
  };

  const updateTheatreNote = (id: string, updates: Partial<TheatreNote>) => {
    setTheatreNotes(notes =>
      notes.map(note => (note.id === id ? { ...note, ...updates } : note))
    );
  };

  const getTheatreNote = (id: string) => {
    return theatreNotes.find(note => note.id === id);
  };

  const getPendingNotes = () => {
    return theatreNotes.filter(note => note.status === 'pending');
  };

  const getScheduledNotes = () => {
    return theatreNotes.filter(note => 
      note.status === 'scheduled' || 
      note.status === 'pre-op' || 
      note.status === 'in-progress'
    );
  };

  return (
    <TheatreContext.Provider
      value={{
        theatreNotes,
        addTheatreNote,
        updateTheatreNote,
        getTheatreNote,
        getPendingNotes,
        getScheduledNotes,
      }}
    >
      {children}
    </TheatreContext.Provider>
  );
}

export function useTheatre() {
  const context = useContext(TheatreContext);
  if (context === undefined) {
    throw new Error('useTheatre must be used within a TheatreProvider');
  }
  return context;
}