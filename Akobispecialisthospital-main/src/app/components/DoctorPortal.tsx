import { useDoctorAuth } from '../context/DoctorAuthContext';
import { DoctorLogin } from './DoctorLogin';
import { DoctorConsultation } from './DoctorConsultation';

export function DoctorPortal() {
  const { isAuthenticated } = useDoctorAuth();

  if (!isAuthenticated) {
    return <DoctorLogin />;
  }

  return <DoctorConsultation />;
}
