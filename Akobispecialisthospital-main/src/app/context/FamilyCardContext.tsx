import { createContext, useContext, useState, ReactNode } from 'react';

export interface FamilyMember {
  id: string;
  patientId: string;
  patientName: string;
  cardNumber: string;
  age: number;
  gender: string;
  relationship: string;
  joinedDate: string;
  totalBills: number;
  outstandingBalance: number;
  status: 'active' | 'suspended';
  originalCardType: string; // Track what card type they had before joining family
  isAttached?: boolean; // Indicates if this is an attached personal card
  personalCardId?: string; // Reference to their personal card if attached
}

export interface AttachedPersonalCard {
  id: string;
  patientId: string;
  patientName: string;
  personalCardNumber: string;
  age: number;
  gender: string;
  relationship: string;
  attachedDate: string;
  totalBills: number;
  outstandingBalance: number;
  status: 'active' | 'suspended';
  familyId: string; // Which family this card is attached to
}

export interface FamilyCard {
  id: string;
  familyCardNumber: string;
  familyName: string;
  headOfFamily: {
    patientId: string;
    name: string;
    cardNumber: string;
  };
  members: FamilyMember[];
  totalFamilyBills: number;
  totalOutstanding: number;
  familyWalletBalance: number;
  createdDate: string;
  status: 'active' | 'suspended';
}

export interface CardConversion {
  id: string;
  patientId: string;
  patientName: string;
  fromCardType: string;
  toCardType: string;
  conversionFee: number;
  conversionDate: string;
  processedBy: string;
  status: 'pending' | 'completed';
}

interface FamilyCardContextType {
  familyCards: FamilyCard[];
  conversions: CardConversion[];
  attachedPersonalCards: AttachedPersonalCard[];
  createFamilyCard: (headOfFamily: { patientId: string; name: string; cardNumber: string }, familyName: string) => void;
  addMemberToFamily: (familyId: string, member: Omit<FamilyMember, 'id' | 'joinedDate' | 'totalBills' | 'outstandingBalance' | 'status'>) => void;
  removeMemberFromFamily: (familyId: string, memberId: string) => void;
  convertToFamilyCard: (patientId: string, patientName: string, currentCardType: string, familyName: string, conversionFee: number) => string;
  convertToIndividualCard: (familyId: string, memberId: string, newCardType: string, conversionFee: number) => void;
  addBillToMember: (familyId: string, memberId: string, billAmount: number) => void;
  getFamilyByPatientId: (patientId: string) => { family: FamilyCard; member: FamilyMember } | null;
  updateFamilyWallet: (familyId: string, amount: number) => void;
  attachPersonalCardToFamily: (familyId: string, personalCard: Omit<AttachedPersonalCard, 'id' | 'attachedDate' | 'totalBills' | 'outstandingBalance' | 'status' | 'familyId'>) => void;
  detachPersonalCardFromFamily: (attachedCardId: string) => void;
  addBillToAttachedCard: (attachedCardId: string, billAmount: number) => void;
  getAttachedCardsByFamily: (familyId: string) => AttachedPersonalCard[];
}

const FamilyCardContext = createContext<FamilyCardContextType | undefined>(undefined);

export function FamilyCardProvider({ children }: { children: React.ReactNode }) {
  const [familyCards, setFamilyCards] = useState<FamilyCard[]>([
    // Sample Family 1
    {
      id: 'FAM001',
      familyCardNumber: 'FC-2026-001',
      familyName: 'Johnson Family',
      headOfFamily: {
        patientId: 'P001',
        name: 'David Johnson',
        cardNumber: 'AKB-001234',
      },
      members: [
        {
          id: 'M001',
          patientId: 'P002',
          patientName: 'Sarah Johnson',
          cardNumber: 'AKB-001235',
          age: 35,
          gender: 'Female',
          relationship: 'Spouse',
          joinedDate: '2026-01-15T00:00:00.000Z',
          totalBills: 45000,
          outstandingBalance: 15000,
          status: 'active',
          originalCardType: 'New Patient Card',
        },
        {
          id: 'M002',
          patientId: 'P003',
          patientName: 'Michael Johnson',
          cardNumber: 'AKB-001236',
          age: 12,
          gender: 'Male',
          relationship: 'Son',
          joinedDate: '2026-01-15T00:00:00.000Z',
          totalBills: 28000,
          outstandingBalance: 8000,
          status: 'active',
          originalCardType: 'New Patient Card',
        },
      ],
      totalFamilyBills: 125000,
      totalOutstanding: 35000,
      familyWalletBalance: 50000,
      createdDate: '2026-01-15T00:00:00.000Z',
      status: 'active',
    },
    // Sample Family 2
    {
      id: 'FAM002',
      familyCardNumber: 'FC-2026-002',
      familyName: 'Williams Family',
      headOfFamily: {
        patientId: 'P010',
        name: 'James Williams',
        cardNumber: 'AKB-002345',
      },
      members: [],
      totalFamilyBills: 85000,
      totalOutstanding: 25000,
      familyWalletBalance: 30000,
      createdDate: '2026-02-10T00:00:00.000Z',
      status: 'active',
    },
  ]);
  const [conversions, setConversions] = useState<CardConversion[]>([]);
  const [attachedPersonalCards, setAttachedPersonalCards] = useState<AttachedPersonalCard[]>([]);

  const createFamilyCard = (
    headOfFamily: { patientId: string; name: string; cardNumber: string },
    familyName: string
  ) => {
    const newFamily: FamilyCard = {
      id: `FAM${(familyCards.length + 1).toString().padStart(3, '0')}`,
      familyCardNumber: `FC-${new Date().getFullYear()}-${(familyCards.length + 1).toString().padStart(3, '0')}`,
      familyName,
      headOfFamily,
      members: [],
      totalFamilyBills: 0,
      totalOutstanding: 0,
      familyWalletBalance: 0,
      createdDate: new Date().toISOString(),
      status: 'active',
    };
    setFamilyCards([...familyCards, newFamily]);
  };

  const addMemberToFamily = (
    familyId: string,
    member: Omit<FamilyMember, 'id' | 'joinedDate' | 'totalBills' | 'outstandingBalance' | 'status'>
  ) => {
    setFamilyCards(
      familyCards.map((family) =>
        family.id === familyId
          ? {
              ...family,
              members: [
                ...family.members,
                {
                  ...member,
                  id: `M${(family.members.length + 1).toString().padStart(3, '0')}`,
                  joinedDate: new Date().toISOString(),
                  totalBills: 0,
                  outstandingBalance: 0,
                  status: 'active',
                },
              ],
            }
          : family
      )
    );
  };

  const removeMemberFromFamily = (familyId: string, memberId: string) => {
    setFamilyCards(
      familyCards.map((family) =>
        family.id === familyId
          ? {
              ...family,
              members: family.members.filter((m) => m.id !== memberId),
            }
          : family
      )
    );
  };

  const convertToFamilyCard = (
    patientId: string,
    patientName: string,
    currentCardType: string,
    familyName: string,
    conversionFee: number
  ): string => {
    // Create conversion record
    const conversion: CardConversion = {
      id: `CONV${(conversions.length + 1).toString().padStart(3, '0')}`,
      patientId,
      patientName,
      fromCardType: currentCardType,
      toCardType: 'Family Card',
      conversionFee,
      conversionDate: new Date().toISOString(),
      processedBy: 'Reception',
      status: 'completed',
    };
    setConversions([...conversions, conversion]);

    // Create new family card
    const newFamilyId = `FAM${(familyCards.length + 1).toString().padStart(3, '0')}`;
    const newFamily: FamilyCard = {
      id: newFamilyId,
      familyCardNumber: `FC-${new Date().getFullYear()}-${(familyCards.length + 1).toString().padStart(3, '0')}`,
      familyName,
      headOfFamily: {
        patientId,
        name: patientName,
        cardNumber: `AKB-${Math.random().toString().slice(2, 8)}`,
      },
      members: [],
      totalFamilyBills: conversionFee,
      totalOutstanding: conversionFee,
      familyWalletBalance: 0,
      createdDate: new Date().toISOString(),
      status: 'active',
    };
    setFamilyCards([...familyCards, newFamily]);

    return newFamilyId;
  };

  const convertToIndividualCard = (
    familyId: string,
    memberId: string,
    newCardType: string,
    conversionFee: number
  ) => {
    const family = familyCards.find((f) => f.id === familyId);
    if (!family) return;

    const member = family.members.find((m) => m.id === memberId);
    if (!member) return;

    // Create conversion record
    const conversion: CardConversion = {
      id: `CONV${(conversions.length + 1).toString().padStart(3, '0')}`,
      patientId: member.patientId,
      patientName: member.patientName,
      fromCardType: 'Family Card',
      toCardType: newCardType,
      conversionFee,
      conversionDate: new Date().toISOString(),
      processedBy: 'Reception',
      status: 'completed',
    };
    setConversions([...conversions, conversion]);

    // Remove member from family
    removeMemberFromFamily(familyId, memberId);

    // Add conversion fee to family bills
    addBillToMember(familyId, memberId, conversionFee);
  };

  const addBillToMember = (familyId: string, memberId: string, billAmount: number) => {
    setFamilyCards(
      familyCards.map((family) =>
        family.id === familyId
          ? {
              ...family,
              members: family.members.map((m) =>
                m.id === memberId
                  ? {
                      ...m,
                      totalBills: m.totalBills + billAmount,
                      outstandingBalance: m.outstandingBalance + billAmount,
                    }
                  : m
              ),
              totalFamilyBills: family.totalFamilyBills + billAmount,
              totalOutstanding: family.totalOutstanding + billAmount,
            }
          : family
      )
    );
  };

  const getFamilyByPatientId = (patientId: string): { family: FamilyCard; member: FamilyMember } | null => {
    for (const family of familyCards) {
      // Check if patient is head of family
      if (family.headOfFamily.patientId === patientId) {
        return {
          family,
          member: {
            id: 'HEAD',
            patientId: family.headOfFamily.patientId,
            patientName: family.headOfFamily.name,
            cardNumber: family.headOfFamily.cardNumber,
            age: 0,
            gender: '',
            relationship: 'Head of Family',
            joinedDate: family.createdDate,
            totalBills: 0,
            outstandingBalance: 0,
            status: 'active',
            originalCardType: 'Family Card',
          },
        };
      }

      // Check if patient is a member
      const member = family.members.find((m) => m.patientId === patientId);
      if (member) {
        return { family, member };
      }
    }
    return null;
  };

  const updateFamilyWallet = (familyId: string, amount: number) => {
    setFamilyCards(
      familyCards.map((family) =>
        family.id === familyId
          ? {
              ...family,
              familyWalletBalance: family.familyWalletBalance + amount,
              totalOutstanding: Math.max(0, family.totalOutstanding - amount),
            }
          : family
      )
    );
  };

  const attachPersonalCardToFamily = (
    familyId: string,
    personalCard: Omit<AttachedPersonalCard, 'id' | 'attachedDate' | 'totalBills' | 'outstandingBalance' | 'status' | 'familyId'>
  ) => {
    const newCard: AttachedPersonalCard = {
      id: `APC${(attachedPersonalCards.length + 1).toString().padStart(3, '0')}`,
      attachedDate: new Date().toISOString(),
      totalBills: 0,
      outstandingBalance: 0,
      status: 'active',
      familyId,
      ...personalCard,
    };
    setAttachedPersonalCards([...attachedPersonalCards, newCard]);
  };

  const detachPersonalCardFromFamily = (attachedCardId: string) => {
    setAttachedPersonalCards(
      attachedPersonalCards.filter((card) => card.id !== attachedCardId)
    );
  };

  const addBillToAttachedCard = (attachedCardId: string, billAmount: number) => {
    setAttachedPersonalCards(
      attachedPersonalCards.map((card) =>
        card.id === attachedCardId
          ? {
              ...card,
              totalBills: card.totalBills + billAmount,
              outstandingBalance: card.outstandingBalance + billAmount,
            }
          : card
      )
    );
  };

  const getAttachedCardsByFamily = (familyId: string) => {
    return attachedPersonalCards.filter((card) => card.familyId === familyId);
  };

  return (
    <FamilyCardContext.Provider
      value={{
        familyCards,
        conversions,
        attachedPersonalCards,
        createFamilyCard,
        addMemberToFamily,
        removeMemberFromFamily,
        convertToFamilyCard,
        convertToIndividualCard,
        addBillToMember,
        getFamilyByPatientId,
        updateFamilyWallet,
        attachPersonalCardToFamily,
        detachPersonalCardFromFamily,
        addBillToAttachedCard,
        getAttachedCardsByFamily,
      }}
    >
      {children}
    </FamilyCardContext.Provider>
  );
}

export function useFamilyCard() {
  const context = useContext(FamilyCardContext);
  if (!context) {
    throw new Error('useFamilyCard must be used within FamilyCardProvider');
  }
  return context;
}