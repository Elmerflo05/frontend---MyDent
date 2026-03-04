/**
 * Calculate patient age from birth date
 */
export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get gender label in Spanish
 */
export const getGenderLabel = (gender: string): string => {
  switch (gender) {
    case 'M': return 'Masculino';
    case 'F': return 'Femenino';
    case 'O': return 'Otro';
    default: return 'No especificado';
  }
};

/**
 * Get statistics from patients array
 */
export const getPatientStats = (patients: any[]) => {
  const total = patients.length;
  const male = patients.filter(p => p.gender === 'M').length;
  const female = patients.filter(p => p.gender === 'F').length;
  const thisMonth = patients.filter(p => {
    const patientDate = new Date(p.createdAt);
    const now = new Date();
    return patientDate.getMonth() === now.getMonth() &&
           patientDate.getFullYear() === now.getFullYear();
  }).length;

  return { total, male, female, thisMonth };
};
