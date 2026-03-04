import type { Patient, TreatmentPlan } from '@/types';
import { patientHasTreatmentType } from './patientHelpers';

export interface PatientFilterOptions {
  searchTerm: string;
  companyFilter: string;
  treatmentFilters: {
    ortodoncia: boolean;
    rehabilitacion: boolean;
    implantes: boolean;
  };
}

/**
 * Filter patients based on search term, company, and treatment types
 */
export const filterPatients = (
  patients: Patient[],
  filters: PatientFilterOptions,
  allTreatmentPlans: TreatmentPlan[]
): Patient[] => {
  return patients.filter(patient => {
    // Search filter
    const matchesSearch = filters.searchTerm === '' ||
      patient.firstName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      patient.dni.includes(filters.searchTerm) ||
      patient.email.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Company filter
    const matchesCompany =
      filters.companyFilter === 'all' ||
      (filters.companyFilter === 'particular' && !patient.companyId) ||
      patient.companyId === filters.companyFilter;

    // Treatment filters
    const hasAnyTreatmentFilter = filters.treatmentFilters.ortodoncia ||
                                    filters.treatmentFilters.rehabilitacion ||
                                    filters.treatmentFilters.implantes;

    let matchesTreatment = true;
    if (hasAnyTreatmentFilter) {
      matchesTreatment = false; // If filters are active, default is false

      // If patient matches any active filter, it's valid
      if (filters.treatmentFilters.ortodoncia &&
          patientHasTreatmentType(patient.id, 'ortodoncia', allTreatmentPlans)) {
        matchesTreatment = true;
      }
      if (filters.treatmentFilters.rehabilitacion &&
          patientHasTreatmentType(patient.id, 'rehabilitacion', allTreatmentPlans)) {
        matchesTreatment = true;
      }
      if (filters.treatmentFilters.implantes &&
          patientHasTreatmentType(patient.id, 'implantes', allTreatmentPlans)) {
        matchesTreatment = true;
      }
    }

    return matchesSearch && matchesCompany && matchesTreatment;
  });
};
