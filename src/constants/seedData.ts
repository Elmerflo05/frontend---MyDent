// Configuración centralizada de datos de prueba
// Siguiendo política anti-hardcodeo
// IMPORTANTE: Las contraseñas se generan automáticamente con el DNI del usuario

// Configuración de sedes de ejemplo
export const TEST_SEDES_CONFIG = [
  {
    id: 'sede_principal',
    nombre: 'Sede Principal - Miraflores',
    codigo: 'SEDE-001',
    direccion: 'Av. Larco 345, Miraflores',
    telefono: '01-234-5678',
    email: 'miraflores@clinica.com',
    ciudad: 'Lima',
    departamento: 'Lima',
    estado: 'activa' as const,
    configuracion: {
      horarioApertura: '08:00',
      horarioCierre: '20:00',
      diasLaborales: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
      moneda: 'PEN',
      timezone: 'America/Lima'
    },
    estadisticas: {
      totalPacientes: 450,
      totalDoctores: 8,
      totalPersonal: 15,
      citasDelDia: 25,
      ingresosMes: 85000
    }
  },
  {
    id: 'sede_san_isidro',
    nombre: 'Sede San Isidro',
    codigo: 'SEDE-002',
    direccion: 'Av. Javier Prado Este 2450, San Isidro',
    telefono: '01-345-6789',
    email: 'sanisidro@clinica.com',
    ciudad: 'Lima',
    departamento: 'Lima',
    estado: 'activa' as const,
    configuracion: {
      horarioApertura: '09:00',
      horarioCierre: '19:00',
      diasLaborales: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
      moneda: 'PEN',
      timezone: 'America/Lima'
    },
    estadisticas: {
      totalPacientes: 320,
      totalDoctores: 5,
      totalPersonal: 10,
      citasDelDia: 18,
      ingresosMes: 62000
    }
  },
  {
    id: 'sede_surco',
    nombre: 'Sede Surco',
    codigo: 'SEDE-003',
    direccion: 'Av. Primavera 1878, Santiago de Surco',
    telefono: '01-456-7890',
    email: 'surco@clinica.com',
    ciudad: 'Lima',
    departamento: 'Lima',
    estado: 'activa' as const,
    configuracion: {
      horarioApertura: '08:30',
      horarioCierre: '18:30',
      diasLaborales: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
      moneda: 'PEN',
      timezone: 'America/Lima'
    },
    estadisticas: {
      totalPacientes: 280,
      totalDoctores: 4,
      totalPersonal: 8,
      citasDelDia: 15,
      ingresosMes: 48000
    }
  }
];

export const TEST_USERS_CONFIG = {
  superAdmin: {
    email: 'superadmin@clinica.com',
    dni: '12345678',
    role: 'super_admin' as const,
    sedeId: null,
    profile: {
      firstName: 'Super',
      lastName: 'Administrador',
      dni: '12345678',
      department: 'Dirección General',
      licenseNumber: 'SA001'
    }
  },
  adminMiraflores: {
    email: 'admin.miraflores@clinica.com',
    dni: '23456789',
    role: 'admin' as const,
    sedeId: 'sede_principal',
    profile: {
      firstName: 'Carlos',
      lastName: 'Administrador',
      dni: '23456789',
      department: 'Administración',
      licenseNumber: 'ADM001'
    }
  },
  adminSanIsidro: {
    email: 'admin.sanisidro@clinica.com',
    dni: '34567890',
    role: 'admin' as const,
    sedeId: 'sede_san_isidro',
    profile: {
      firstName: 'Andrea',
      lastName: 'Gestora',
      dni: '34567890',
      department: 'Administración',
      licenseNumber: 'ADM002'
    }
  },
  adminSurco: {
    email: 'admin.surco@clinica.com',
    dni: '45678901',
    role: 'admin' as const,
    sedeId: 'sede_surco',
    profile: {
      firstName: 'Roberto',
      lastName: 'Director',
      dni: '45678901',
      department: 'Administración',
      licenseNumber: 'ADM003'
    }
  },
  // Doctores por sede
  doctorMiraflores1: {
    email: 'doctor1.miraflores@clinica.com',
    dni: '56789012',
    role: 'doctor' as const,
    sedeId: 'sede_principal',
    profile: {
      firstName: 'Juan',
      lastName: 'Pérez',
      dni: '56789012',
      department: 'Odontología',
      licenseNumber: 'DOC001',
      specialties: ['Odontología General', 'Endodoncia']
    }
  },
  doctorMiraflores2: {
    email: 'doctor2.miraflores@clinica.com',
    dni: '67890123',
    role: 'doctor' as const,
    sedeId: 'sede_principal',
    profile: {
      firstName: 'María',
      lastName: 'González',
      dni: '67890123',
      department: 'Odontología',
      licenseNumber: 'DOC002',
      specialties: ['Ortodoncia', 'Odontopediatría']
    }
  },
  doctorSanIsidro: {
    email: 'doctor.sanisidro@clinica.com',
    dni: '78901234',
    role: 'doctor' as const,
    sedeId: 'sede_san_isidro',
    profile: {
      firstName: 'Luis',
      lastName: 'Martínez',
      dni: '78901234',
      department: 'Odontología',
      licenseNumber: 'DOC003',
      specialties: ['Cirugía Oral', 'Implantología']
    }
  },
  doctorSurco: {
    email: 'doctor.surco@clinica.com',
    dni: '89012345',
    role: 'doctor' as const,
    sedeId: 'sede_surco',
    profile: {
      firstName: 'Ana',
      lastName: 'Rodríguez',
      dni: '89012345',
      department: 'Odontología',
      licenseNumber: 'DOC004',
      specialties: ['Periodoncia', 'Estética Dental']
    }
  },
  // Recepcionistas por sede
  recepcionistaMiraflores: {
    email: 'recepcion.miraflores@clinica.com',
    dni: '90123456',
    role: 'receptionist' as const,
    sedeId: 'sede_principal',
    profile: {
      firstName: 'María',
      lastName: 'García',
      dni: '90123456',
      department: 'Recepción',
      licenseNumber: 'REC001'
    }
  },
  recepcionistaSanIsidro: {
    email: 'recepcion.sanisidro@clinica.com',
    dni: '01234567',
    role: 'receptionist' as const,
    sedeId: 'sede_san_isidro',
    profile: {
      firstName: 'Carmen',
      lastName: 'López',
      dni: '01234567',
      department: 'Recepción',
      licenseNumber: 'REC002'
    }
  },
  recepcionistaSurco: {
    email: 'recepcion.surco@clinica.com',
    dni: '11223344',
    role: 'receptionist' as const,
    sedeId: 'sede_surco',
    profile: {
      firstName: 'Patricia',
      lastName: 'Mendoza',
      dni: '11223344',
      department: 'Recepción',
      licenseNumber: 'REC003'
    }
  },
  // Técnicos de imágenes
  imagingTechnicianMirafloresLab: {
    email: 'lab1.miraflores@clinica.com',
    dni: '22334455',
    role: 'imaging_technician' as const,
    sedeId: 'sede_principal',
    profile: {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      dni: '22334455',
      department: 'Radiología',
      licenseNumber: 'IMG004'
    }
  },
  imagingTechnicianSanIsidroLab: {
    email: 'lab.sanisidro@clinica.com',
    dni: '33445566',
    role: 'imaging_technician' as const,
    sedeId: 'sede_san_isidro',
    profile: {
      firstName: 'Jorge',
      lastName: 'Díaz',
      dni: '33445566',
      department: 'Radiología',
      licenseNumber: 'IMG005'
    }
  },
  imagingTechnicianMiraflores: {
    email: 'imaging1.miraflores@clinica.com',
    dni: '44556677',
    role: 'imaging_technician' as const,
    sedeId: 'sede_principal',
    profile: {
      firstName: 'Pedro',
      lastName: 'Sánchez',
      dni: '44556677',
      department: 'Radiología',
      licenseNumber: 'IMG001'
    }
  },
  imagingTechnicianSanIsidro: {
    email: 'imaging.sanisidro@clinica.com',
    dni: '55667788',
    role: 'imaging_technician' as const,
    sedeId: 'sede_san_isidro',
    profile: {
      firstName: 'Miguel',
      lastName: 'Torres',
      dni: '55667788',
      department: 'Radiología',
      licenseNumber: 'IMG002'
    }
  },
  imagingTechnicianSurco: {
    email: 'imaging.surco@clinica.com',
    dni: '66778899',
    role: 'imaging_technician' as const,
    sedeId: 'sede_surco',
    profile: {
      firstName: 'Laura',
      lastName: 'Fernández',
      dni: '66778899',
      department: 'Radiología',
      licenseNumber: 'IMG003'
    }
  },
  // Pacientes (no tienen sede fija, pueden atenderse en cualquiera)
  patient1: {
    email: 'paciente1@gmail.com',
    dni: '77889900',
    role: 'patient' as const,
    sedeId: null,
    profile: {
      firstName: 'Ana',
      lastName: 'López',
      dni: '77889900',
      department: 'Paciente',
      licenseNumber: 'PAC001'
    }
  },
  patient2: {
    email: 'paciente2@gmail.com',
    dni: '88990011',
    role: 'patient' as const,
    sedeId: null,
    profile: {
      firstName: 'Roberto',
      lastName: 'Vargas',
      dni: '88990011',
      department: 'Paciente',
      licenseNumber: 'PAC002'
    }
  },
  // Clientes externos (pueden solicitar servicios de cualquier sede)
  externalClient1: {
    email: 'clinicaexterna@empresa.com',
    dni: '99001122',
    role: 'external_client' as const,
    sedeId: null,
    profile: {
      firstName: 'Clínica',
      lastName: 'Externa S.A.',
      dni: '99001122',
      department: 'Cliente Externo',
      licenseNumber: 'EXT001'
    }
  },
  externalClient2: {
    email: 'consultorio@salud.com',
    dni: '10111213',
    role: 'external_client' as const,
    sedeId: null,
    profile: {
      firstName: 'Consultorio',
      lastName: 'Salud Plus',
      dni: '10111213',
      department: 'Cliente Externo',
      licenseNumber: 'EXT002'
    }
  }
};

export const DEFAULT_USER_STATUS = 'active';

export const SEED_CONFIG = {
  userCount: 20,
  patientCount: 150,
  appointmentCount: 300,
  medicalRecordCount: 200,
  treatmentPlanCount: 80,
  labRequestCount: 120,
  paymentCount: 250,
  notificationCount: 100
};
