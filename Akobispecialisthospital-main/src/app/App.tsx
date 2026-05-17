import { EmergencyProvider } from './context/EmergencyContext';
import { CashierProvider } from './context/CashierContext';
import { AdmissionProvider } from './context/AdmissionContext';
import { CardTypesProvider } from './context/CardTypesContext';
import { FamilyCardProvider } from './context/FamilyCardContext';
import { DischargeProvider } from './context/DischargeContext';
import { PatientQueueProvider } from './context/PatientQueueContext';
import { DoctorAuthProvider } from './context/DoctorAuthContext';
import { TheatreProvider } from './context/TheatreContext';
import { TheatreAuthProvider } from './context/TheatreAuthContext';
import { VitalSignsProvider } from './context/VitalSignsContext';
import { DrugRequestProvider } from './context/DrugRequestContext';
import { LabTechnicianAuthProvider } from './context/LabTechnicianAuthContext';
import { PharmacyInventoryProvider } from './context/PharmacyInventoryContext';
import { StaffAuthProvider } from './context/StaffAuthContext';
import { Root } from './components/Root';

export default function App() {
  return (
    <PharmacyInventoryProvider>
      <DoctorAuthProvider>
        <LabTechnicianAuthProvider>
          <TheatreAuthProvider>
            <EmergencyProvider>
              <CashierProvider>
                <AdmissionProvider>
                  <CardTypesProvider>
                    <FamilyCardProvider>
                      <DischargeProvider>
                        <StaffAuthProvider>
                          <PatientQueueProvider>
                            <TheatreProvider>
                              <VitalSignsProvider>
                                <DrugRequestProvider>
                                  <Root />
                                </DrugRequestProvider>
                              </VitalSignsProvider>
                            </TheatreProvider>
                          </PatientQueueProvider>
                        </StaffAuthProvider>
                      </DischargeProvider>
                    </FamilyCardProvider>
                  </CardTypesProvider>
                </AdmissionProvider>
              </CashierProvider>
            </EmergencyProvider>
          </TheatreAuthProvider>
        </LabTechnicianAuthProvider>
      </DoctorAuthProvider>
    </PharmacyInventoryProvider>
  );
}
