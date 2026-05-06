import { createContext, useContext, useState, ReactNode } from 'react';

interface CardType {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'active' | 'inactive';
}

interface CardTypesContextType {
  cardTypes: CardType[];
  addCardType: (cardType: Omit<CardType, 'id'>) => void;
  updateCardType: (id: string, cardType: Partial<CardType>) => void;
  deleteCardType: (id: string) => void;
  toggleCardTypeStatus: (id: string) => void;
}

const CardTypesContext = createContext<CardTypesContextType | undefined>(undefined);

export function CardTypesProvider({ children }: { children: ReactNode }) {
  const [cardTypes, setCardTypes] = useState<CardType[]>([
    { id: '1', name: 'New Patient Card', description: 'Standard card for new patient registration', color: 'blue', status: 'active' },
    { id: '2', name: 'Card Replacement (Lost)', description: 'Replacement for lost patient cards', color: 'red', status: 'active' },
    { id: '3', name: 'Card Replacement (Damaged)', description: 'Replacement for damaged patient cards', color: 'orange', status: 'active' },
    { id: '4', name: 'VIP Patient Card', description: 'Premium card for VIP patients', color: 'purple', status: 'active' },
    { id: '5', name: 'Staff Dependent Card', description: 'Card for staff family members', color: 'green', status: 'active' },
    { id: '6', name: 'Family Card', description: 'Card for family members of registered patients', color: 'cyan', status: 'active' },
  ]);

  const addCardType = (cardType: Omit<CardType, 'id'>) => {
    const newCardType = {
      ...cardType,
      id: (cardTypes.length + 1).toString(),
    };
    setCardTypes([...cardTypes, newCardType]);
  };

  const updateCardType = (id: string, updates: Partial<CardType>) => {
    setCardTypes(cardTypes.map(ct => ct.id === id ? { ...ct, ...updates } : ct));
  };

  const deleteCardType = (id: string) => {
    setCardTypes(cardTypes.filter(ct => ct.id !== id));
  };

  const toggleCardTypeStatus = (id: string) => {
    setCardTypes(cardTypes.map(ct =>
      ct.id === id ? { ...ct, status: ct.status === 'active' ? 'inactive' : 'active' } : ct
    ));
  };

  return (
    <CardTypesContext.Provider value={{
      cardTypes,
      addCardType,
      updateCardType,
      deleteCardType,
      toggleCardTypeStatus
    }}>
      {children}
    </CardTypesContext.Provider>
  );
}

export function useCardTypes() {
  const context = useContext(CardTypesContext);
  if (!context) {
    throw new Error('useCardTypes must be used within CardTypesProvider');
  }
  return context;
}