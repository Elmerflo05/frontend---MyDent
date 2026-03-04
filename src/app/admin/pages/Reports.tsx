import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Download, Building, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateToYMD } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import { useSede } from '@/hooks/useSede';
import {
  EstadisticasOdontologicasService,
  type ReportePorConsultorio,
  type ReportePorEspecialidad,
  type ReportePorDoctor
} from '@/services/estadisticasOdontologicas';
import {
  EstadisticasConsultoriosService,
  type EstadisticasConsultorio
} from '@/services/estadisticasConsultorios';
import {
  obtenerRangoFechas,
  ReportsFilters,
  OverviewReport,
  ServicesReport,
  PatientsReport,
  RevenueReport,
  ConsultorioReport,
  EspecialidadReport,
  DoctorReport,
  ConsultoriosStatisticsReport,
  type ReportData
} from '@/components/reports';
import { reportsApi } from '@/services/api/reportsApi';

const Reports = () => {
  const { user } = useAuth();
  const { sedesDisponibles } = useSede();

  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [selectedSede, setSelectedSede] = useState<string>('');
  const [sedeInitialized, setSedeInitialized] = useState(false);

  // Estados para los nuevos reportes
  const [reportesConsultorio, setReportesConsultorio] = useState<ReportePorConsultorio[]>([]);
  const [reportesEspecialidad, setReportesEspecialidad] = useState<ReportePorEspecialidad[]>([]);
  const [reportesDoctor, setReportesDoctor] = useState<ReportePorDoctor[]>([]);
  const [loadingReportes, setLoadingReportes] = useState(false);

  // Estados para estadísticas de consultorios
  const [estadisticasConsultorios, setEstadisticasConsultorios] = useState<EstadisticasConsultorio[]>([]);
  const [resumenConsultorios, setResumenConsultorios] = useState<any>(null);

  // Estado para manejo de errores
  const [errorReportes, setErrorReportes] = useState<string | null>(null);

  // Estados para datos de reportes del backend (Overview, Services, Patients)
  const [currentReportData, setCurrentReportData] = useState<ReportData>({
    appointments: { total: 0, completed: 0, cancelled: 0, pending: 0, monthlyData: [] },
    patients: { total: 0, new: 0, continuing: 0, ageGroups: [] },
    revenue: { total: 0, monthly: 0, services: [] },
    services: { clinic: [], laboratory: [] }
  });

  // Control de permisos
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const canFilterBySede = isSuperAdmin; // Solo super admin puede filtrar por sede

  // Establecer sede automáticamente para administradores de sede
  useEffect(() => {
    if (isAdmin && user?.sedeId) {
      // Admin de sede: forzar su sede
      setSelectedSede(user.sedeId.toString());
      setSedeInitialized(true);
    } else if (isSuperAdmin) {
      // Super admin: puede ver todas
      setSelectedSede('all');
      setSedeInitialized(true);
    }
  }, [isAdmin, isSuperAdmin, user?.sedeId]);

  // Función para exportar a Excel
  const handleExportToExcel = () => {
    try {
      const sedeName = selectedSede === 'all'
        ? 'Todas las Sedes'
        : sedesDisponibles.find(s => s.id === selectedSede)?.nombre || 'Sede';

      let tableHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th { background-color: #2563eb; color: white; padding: 12px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
            td { padding: 10px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .section-title { background-color: #dbeafe; font-weight: bold; padding: 15px; margin-top: 20px; }
            h3 { margin-top: 30px; color: #1e40af; }
          </style>
        </head>
        <body>
          <h2>Reporte de Analytics - ${sedeName}</h2>
          <p>Tipo de Reporte: ${reportType === 'overview' ? 'Resumen General' : reportType === 'services' ? 'Servicios' : reportType === 'patients' ? 'Pacientes' : reportType === 'consultorio' ? 'Por Consultorio' : reportType === 'especialidad' ? 'Por Especialidad' : 'Por Doctor'}</p>
          <p>Período: ${dateRange === 'week' ? 'Última Semana' : dateRange === 'month' ? 'Último Mes' : dateRange === '3months' ? 'Últimos 3 Meses' : 'Último Año'}</p>
          <p>Generado el: ${new Date().toLocaleString('es-ES')}</p>
          <br>
      `;

      // OVERVIEW REPORT
      if (reportType === 'overview') {
        // KPIs
        tableHTML += `
          <h3>Indicadores Clave (KPIs)</h3>
          <table>
            <thead><tr>
              <th>Total Citas</th>
              <th>Total Pacientes</th>
              <th>Ingresos Totales</th>
              <th>Tasa de Completación</th>
            </tr></thead>
            <tbody><tr>
              <td>${currentReportData.appointments?.total || 0}</td>
              <td>${currentReportData.patients?.total || 0}</td>
              <td>S/ ${currentReportData.revenue?.total?.toLocaleString() || 0}</td>
              <td>${currentReportData.appointments?.total > 0 ? Math.round((currentReportData.appointments?.completed / currentReportData.appointments?.total) * 100) : 0}%</td>
            </tr></tbody>
          </table>
        `;

        // Citas por Mes
        tableHTML += `
          <h3>Citas por Mes</h3>
          <table>
            <thead><tr><th>Mes</th><th>Cantidad de Citas</th></tr></thead>
            <tbody>
        `;
        currentReportData.appointments?.monthlyData?.forEach(data => {
          tableHTML += `<tr><td>${data.month}</td><td>${data.count}</td></tr>`;
        });
        tableHTML += `</tbody></table>`;

        // Estado de Citas
        tableHTML += `
          <h3>Estado de Citas</h3>
          <table>
            <thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
            <tbody>
              <tr><td>Completadas</td><td>${currentReportData.appointments?.completed || 0}</td></tr>
              <tr><td>Pendientes</td><td>${currentReportData.appointments?.pending || 0}</td></tr>
              <tr><td>Canceladas</td><td>${currentReportData.appointments?.cancelled || 0}</td></tr>
            </tbody>
          </table>
        `;

        // Ingresos por Servicio
        tableHTML += `
          <h3>Ingresos por Servicio</h3>
          <table>
            <thead><tr><th>Servicio</th><th>Ingreso (S/)</th></tr></thead>
            <tbody>
        `;
        currentReportData.revenue?.services?.forEach(service => {
          tableHTML += `<tr><td>${service.name}</td><td>S/ ${service.amount.toLocaleString()}</td></tr>`;
        });
        tableHTML += `</tbody></table>`;

        // Distribución por Edad
        tableHTML += `
          <h3>Distribución de Pacientes por Edad</h3>
          <table>
            <thead><tr><th>Rango de Edad</th><th>Cantidad</th><th>Porcentaje</th></tr></thead>
            <tbody>
        `;
        currentReportData.patients?.ageGroups?.forEach(group => {
          const percentage = Math.round((group.count / currentReportData.patients?.total) * 100);
          tableHTML += `<tr><td>${group.range} años</td><td>${group.count}</td><td>${percentage}%</td></tr>`;
        });
        tableHTML += `</tbody></table>`;
      }

      // SERVICES REPORT
      if (reportType === 'services') {
        // Servicios de Clínica
        tableHTML += `
          <h3>Servicios de Clínica</h3>
          <table>
            <thead><tr><th>Servicio</th><th>Cantidad Realizada</th></tr></thead>
            <tbody>
        `;
        currentReportData.services?.clinic?.forEach(service => {
          tableHTML += `<tr><td>${service.name}</td><td>${service.count}</td></tr>`;
        });
        tableHTML += `</tbody></table>`;

        // Servicios de Laboratorio
        tableHTML += `
          <h3>Servicios de Laboratorio</h3>
          <table>
            <thead><tr><th>Servicio</th><th>Cantidad Realizada</th></tr></thead>
            <tbody>
        `;
        currentReportData.services?.laboratory?.forEach(service => {
          tableHTML += `<tr><td>${service.name}</td><td>${service.count}</td></tr>`;
        });
        tableHTML += `</tbody></table>`;

        // Totales Comparativos
        const totalClinic = currentReportData.services?.clinic?.reduce((sum, s) => sum + s.count, 0) || 0;
        const totalLab = currentReportData.services?.laboratory?.reduce((sum, s) => sum + s.count, 0) || 0;
        tableHTML += `
          <h3>Resumen de Servicios</h3>
          <table>
            <thead><tr><th>Tipo</th><th>Total Realizados</th></tr></thead>
            <tbody>
              <tr><td>Servicios de Clínica</td><td>${totalClinic}</td></tr>
              <tr><td>Servicios de Laboratorio</td><td>${totalLab}</td></tr>
              <tr><td><strong>TOTAL GENERAL</strong></td><td><strong>${totalClinic + totalLab}</strong></td></tr>
            </tbody>
          </table>
        `;
      }

      // PATIENTS REPORT
      if (reportType === 'patients') {
        // Resumen de Pacientes
        tableHTML += `
          <h3>Resumen de Pacientes</h3>
          <table>
            <thead><tr><th>Total Pacientes</th><th>Pacientes Nuevos</th><th>Pacientes Continuadores</th></tr></thead>
            <tbody><tr>
              <td>${currentReportData.patients?.total || 0}</td>
              <td>${currentReportData.patients?.new || 0}</td>
              <td>${currentReportData.patients?.continuing || 0}</td>
            </tr></tbody>
          </table>
        `;

        // Distribución Detallada por Edad
        tableHTML += `
          <h3>Distribución Detallada por Edad</h3>
          <table>
            <thead><tr><th>Rango de Edad</th><th>Cantidad de Pacientes</th><th>Porcentaje del Total</th></tr></thead>
            <tbody>
        `;
        currentReportData.patients?.ageGroups?.forEach(group => {
          const percentage = Math.round((group.count / currentReportData.patients?.total) * 100);
          tableHTML += `<tr><td>${group.range} años</td><td>${group.count}</td><td>${percentage}%</td></tr>`;
        });
        tableHTML += `</tbody></table>`;
      }

      // CONSULTORIO REPORT
      if (reportType === 'consultorio' && reportesConsultorio.length > 0) {
        tableHTML += `
          <h3>Reporte Detallado por Consultorio</h3>
          <table>
            <thead>
              <tr>
                <th>Consultorio</th>
                <th>Total Citas</th>
                <th>Completadas</th>
                <th>Canceladas</th>
                <th>Ingresos Bruto</th>
                <th>Duración Promedio</th>
                <th>Tasa Ocupación</th>
                <th>Ingreso/Cita</th>
              </tr>
            </thead>
            <tbody>
        `;
        reportesConsultorio.forEach(item => {
          const ingresoPorCita = item.totalCitas > 0 ? Math.round(item.ingresosBruto / item.totalCitas) : 0;
          tableHTML += `
            <tr>
              <td>${item.consultorio || 'N/A'}</td>
              <td>${item.totalCitas || 0}</td>
              <td>${item.citasCompletadas || 0}</td>
              <td>${item.citasCanceladas || 0}</td>
              <td>S/ ${item.ingresosBruto?.toLocaleString() || 0}</td>
              <td>${item.duracionPromedio || 0} min</td>
              <td>${item.tasaOcupacion || 0}%</td>
              <td>S/ ${ingresoPorCita}</td>
            </tr>
          `;
        });
        tableHTML += `</tbody></table>`;
      }

      // ESPECIALIDAD REPORT
      if (reportType === 'especialidad' && reportesEspecialidad.length > 0) {
        tableHTML += `
          <h3>Reporte Detallado por Especialidad</h3>
          <table>
            <thead>
              <tr>
                <th>Especialidad</th>
                <th>Total Citas</th>
                <th>Doctores</th>
                <th>Completadas</th>
                <th>Ingresos Bruto</th>
                <th>Precio Promedio</th>
                <th>Tasa Completación</th>
              </tr>
            </thead>
            <tbody>
        `;
        reportesEspecialidad.forEach(item => {
          const tasaCompletacion = item.totalCitas > 0 ? Math.round((item.citasCompletadas / item.totalCitas) * 100) : 0;
          tableHTML += `
            <tr>
              <td>${item.especialidad || 'N/A'}</td>
              <td>${item.totalCitas || 0}</td>
              <td>${item.doctores || 0}</td>
              <td>${item.citasCompletadas || 0}</td>
              <td>S/ ${item.ingresosBruto?.toLocaleString() || 0}</td>
              <td>S/ ${item.precioPromedio?.toFixed(2) || '0.00'}</td>
              <td>${tasaCompletacion}%</td>
            </tr>
          `;
        });
        tableHTML += `</tbody></table>`;
      }

      // DOCTOR REPORT
      if (reportType === 'doctor' && reportesDoctor.length > 0) {
        tableHTML += `
          <h3>Reporte Detallado por Doctor</h3>
          <table>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Especialidades</th>
                <th>Total Citas</th>
                <th>Completadas</th>
                <th>Canceladas</th>
                <th>Ingresos Bruto</th>
                <th>Promedio/Cita</th>
                <th>Tasa Completación</th>
              </tr>
            </thead>
            <tbody>
        `;
        reportesDoctor.forEach(item => {
          const especialidades = item.especialidades?.join(', ') || 'N/A';
          tableHTML += `
            <tr>
              <td>${item.nombreCompleto || 'N/A'}</td>
              <td>${especialidades}</td>
              <td>${item.totalCitas || 0}</td>
              <td>${item.citasCompletadas || 0}</td>
              <td>${item.citasCanceladas || 0}</td>
              <td>S/ ${item.ingresosBruto?.toLocaleString() || 0}</td>
              <td>S/ ${item.promedioIngresoPorCita?.toFixed(2) || '0.00'}</td>
              <td>${item.tasaCompletacion || 0}%</td>
            </tr>
          `;
        });
        tableHTML += `</tbody></table>`;
      }

      tableHTML += `
        </body>
        </html>
      `;

      const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_${reportType}_${formatDateToYMD(new Date())}.xls`;
      link.click();

      toast.success('Reporte exportado a Excel correctamente');
    } catch (error) {
      toast.error('Error al exportar a Excel');
    }
  };

  // Función para exportar a PDF
  const handleExportToPDF = () => {
    try {
      const sedeName = selectedSede === 'all'
        ? 'Todas las Sedes'
        : sedesDisponibles.find(s => s.id === selectedSede)?.nombre || 'Sede';

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('No se pudo abrir la ventana de exportación');
        return;
      }

      let contentHTML = '';

      // OVERVIEW REPORT
      if (reportType === 'overview') {
        // KPIs
        contentHTML += `
          <h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 20px;">Indicadores Clave (KPIs)</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
            <div style="background: white; padding: 15px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <strong style="color: #3b82f6; font-size: 12px;">Total Citas</strong>
              <p style="font-size: 28px; margin: 5px 0; font-weight: bold;">${currentReportData.appointments?.total || 0}</p>
            </div>
            <div style="background: white; padding: 15px; border-left: 4px solid #10b981; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <strong style="color: #10b981; font-size: 12px;">Total Pacientes</strong>
              <p style="font-size: 28px; margin: 5px 0; font-weight: bold;">${currentReportData.patients?.total || 0}</p>
            </div>
            <div style="background: white; padding: 15px; border-left: 4px solid #8b5cf6; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <strong style="color: #8b5cf6; font-size: 12px;">Ingresos Totales</strong>
              <p style="font-size: 28px; margin: 5px 0; font-weight: bold;">S/ ${currentReportData.revenue?.total?.toLocaleString() || 0}</p>
            </div>
            <div style="background: white; padding: 15px; border-left: 4px solid #10b981; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <strong style="color: #10b981; font-size: 12px;">Tasa Completación</strong>
              <p style="font-size: 28px; margin: 5px 0; font-weight: bold;">${currentReportData.appointments?.total > 0 ? Math.round((currentReportData.appointments?.completed / currentReportData.appointments?.total) * 100) : 0}%</p>
            </div>
          </div>
        `;

        // Citas por Mes
        contentHTML += `<h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 30px;">Citas por Mes</h3><div style="background: #f9fafb; padding: 15px; margin-bottom: 20px; border-radius: 8px;">`;
        currentReportData.appointments?.monthlyData?.forEach(data => {
          contentHTML += `<div style="margin-bottom: 10px;"><strong>${data.month}:</strong> ${data.count} citas</div>`;
        });
        contentHTML += `</div>`;

        // Estado de Citas
        contentHTML += `
          <h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 30px;">Estado de Citas</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
            <div style="background: #d1fae5; padding: 15px; border-left: 4px solid #10b981; border-radius: 8px;">
              <strong style="color: #065f46;">Completadas</strong>
              <p style="font-size: 24px; margin: 5px 0; font-weight: bold; color: #10b981;">${currentReportData.appointments?.completed || 0}</p>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 8px;">
              <strong style="color: #92400e;">Pendientes</strong>
              <p style="font-size: 24px; margin: 5px 0; font-weight: bold; color: #f59e0b;">${currentReportData.appointments?.pending || 0}</p>
            </div>
            <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 8px;">
              <strong style="color: #991b1b;">Canceladas</strong>
              <p style="font-size: 24px; margin: 5px 0; font-weight: bold; color: #ef4444;">${currentReportData.appointments?.cancelled || 0}</p>
            </div>
          </div>
        `;

        // Ingresos por Servicio
        contentHTML += `<h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 30px;">Ingresos por Servicio</h3><div style="background: #f9fafb; padding: 15px; margin-bottom: 20px; border-radius: 8px;">`;
        currentReportData.revenue?.services?.forEach(service => {
          contentHTML += `<div style="margin-bottom: 10px;"><strong>${service.name}:</strong> S/ ${service.amount.toLocaleString()}</div>`;
        });
        contentHTML += `</div>`;

        // Distribución por Edad
        contentHTML += `<h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 30px;">Distribución de Pacientes por Edad</h3>`;
        currentReportData.patients?.ageGroups?.forEach(group => {
          const percentage = Math.round((group.count / currentReportData.patients?.total) * 100);
          contentHTML += `
            <div style="background: white; border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong>${group.range} años</strong>
                <span style="font-size: 18px; font-weight: bold; color: #3b82f6;">${group.count} pacientes</span>
              </div>
              <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #3b82f6; height: 100%; width: ${percentage}%;"></div>
              </div>
              <p style="margin-top: 5px; font-size: 12px; color: #6b7280;">${percentage}% del total</p>
            </div>
          `;
        });
      }

      // SERVICES REPORT
      if (reportType === 'services') {
        // Servicios de Clínica
        contentHTML += `<h3 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 20px;">Servicios de Clínica</h3>`;
        currentReportData.services?.clinic?.forEach(service => {
          contentHTML += `
            <div style="background: #dbeafe; padding: 12px; margin-bottom: 8px; border-radius: 8px; display: flex; justify-content: space-between;">
              <span style="font-weight: 500;">${service.name}</span>
              <span style="font-weight: bold; color: #1d4ed8;">${service.count}</span>
            </div>
          `;
        });

        // Servicios de Laboratorio
        contentHTML += `<h3 style="color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; margin-top: 30px;">Servicios de Laboratorio</h3>`;
        currentReportData.services?.laboratory?.forEach(service => {
          contentHTML += `
            <div style="background: #ede9fe; padding: 12px; margin-bottom: 8px; border-radius: 8px; display: flex; justify-content: space-between;">
              <span style="font-weight: 500;">${service.name}</span>
              <span style="font-weight: bold; color: #7c3aed;">${service.count}</span>
            </div>
          `;
        });

        // Totales Comparativos
        const totalClinic = currentReportData.services?.clinic?.reduce((sum, s) => sum + s.count, 0) || 0;
        const totalLab = currentReportData.services?.laboratory?.reduce((sum, s) => sum + s.count, 0) || 0;
        contentHTML += `
          <h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 30px;">Resumen de Servicios</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
            <div style="background: #dbeafe; padding: 20px; text-align: center; border-radius: 8px;">
              <p style="font-size: 14px; color: #1e40af; margin-bottom: 10px;">Servicios de Clínica</p>
              <p style="font-size: 32px; font-weight: bold; color: #1d4ed8; margin: 0;">${totalClinic}</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">Total de servicios realizados</p>
            </div>
            <div style="background: #ede9fe; padding: 20px; text-align: center; border-radius: 8px;">
              <p style="font-size: 14px; color: #7c3aed; margin-bottom: 10px;">Servicios de Laboratorio</p>
              <p style="font-size: 32px; font-weight: bold; color: #7c3aed; margin: 0;">${totalLab}</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">Total de análisis realizados</p>
            </div>
          </div>
        `;
      }

      // PATIENTS REPORT
      if (reportType === 'patients') {
        // Resumen de Pacientes
        contentHTML += `
          <h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 20px;">Resumen de Pacientes</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
            <div style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 8px;">
              <strong style="color: #1e40af; font-size: 12px;">Total Pacientes</strong>
              <p style="font-size: 28px; margin: 5px 0; font-weight: bold; color: #1d4ed8;">${currentReportData.patients?.total || 0}</p>
            </div>
            <div style="background: #d1fae5; padding: 15px; border-left: 4px solid #10b981; border-radius: 8px;">
              <strong style="color: #065f46; font-size: 12px;">Pacientes Nuevos</strong>
              <p style="font-size: 28px; margin: 5px 0; font-weight: bold; color: #10b981;">${currentReportData.patients?.new || 0}</p>
            </div>
            <div style="background: #ede9fe; padding: 15px; border-left: 4px solid #8b5cf6; border-radius: 8px;">
              <strong style="color: #6d28d9; font-size: 12px;">Continuadores</strong>
              <p style="font-size: 28px; margin: 5px 0; font-weight: bold; color: #7c3aed;">${currentReportData.patients?.continuing || 0}</p>
            </div>
          </div>
        `;

        // Distribución Detallada por Edad
        contentHTML += `<h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 30px;">Distribución Detallada por Edad</h3>`;
        currentReportData.patients?.ageGroups?.forEach(group => {
          const percentage = Math.round((group.count / currentReportData.patients?.total) * 100);
          contentHTML += `
            <div style="background: white; border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong>${group.range} años</strong>
                <span style="font-size: 18px; font-weight: bold; color: #3b82f6;">${group.count} pacientes</span>
              </div>
              <div style="background: #e5e7eb; height: 10px; border-radius: 5px; overflow: hidden;">
                <div style="background: #3b82f6; height: 100%; width: ${percentage}%; transition: width 0.5s;"></div>
              </div>
              <p style="margin-top: 5px; font-size: 12px; color: #6b7280;">${percentage}% del total</p>
            </div>
          `;
        });
      }

      // CONSULTORIO REPORT
      if (reportType === 'consultorio' && reportesConsultorio.length > 0) {
        contentHTML += `<h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-top: 20px;">Reporte Detallado por Consultorio</h3>`;
        reportesConsultorio.forEach(item => {
          const ingresoPorCita = item.totalCitas > 0 ? Math.round(item.ingresosBruto / item.totalCitas) : 0;
          contentHTML += `
            <div style="background: #f9fafb; padding: 15px; margin-bottom: 15px; border-left: 4px solid #2563eb; border-radius: 8px;">
              <h4 style="margin: 0 0 15px 0; color: #1e40af;">${item.consultorio || 'N/A'}</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <div><strong>Total Citas:</strong> ${item.totalCitas || 0}</div>
                <div><strong>Completadas:</strong> <span style="color: #10b981;">${item.citasCompletadas || 0}</span></div>
                <div><strong>Canceladas:</strong> <span style="color: #ef4444;">${item.citasCanceladas || 0}</span></div>
                <div><strong>Ingresos Bruto:</strong> <span style="color: #8b5cf6;">S/ ${item.ingresosBruto?.toLocaleString() || 0}</span></div>
                <div><strong>Duración Promedio:</strong> ${item.duracionPromedio || 0} min</div>
                <div><strong>Tasa Ocupación:</strong> ${item.tasaOcupacion || 0}%</div>
                <div><strong>Ingreso/Cita:</strong> <span style="color: #f59e0b;">S/ ${ingresoPorCita}</span></div>
              </div>
            </div>
          `;
        });
      }

      // ESPECIALIDAD REPORT
      if (reportType === 'especialidad' && reportesEspecialidad.length > 0) {
        contentHTML += `<h3 style="color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; margin-top: 20px;">Reporte Detallado por Especialidad</h3>`;
        reportesEspecialidad.forEach(item => {
          const tasaCompletacion = item.totalCitas > 0 ? Math.round((item.citasCompletadas / item.totalCitas) * 100) : 0;
          contentHTML += `
            <div style="background: #faf5ff; padding: 15px; margin-bottom: 15px; border-left: 4px solid #8b5cf6; border-radius: 8px;">
              <h4 style="margin: 0 0 15px 0; color: #6d28d9;">${item.especialidad || 'N/A'}</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <div><strong>Total Citas:</strong> ${item.totalCitas || 0}</div>
                <div><strong>Doctores:</strong> ${item.doctores || 0}</div>
                <div><strong>Completadas:</strong> <span style="color: #10b981;">${item.citasCompletadas || 0}</span></div>
                <div><strong>Ingresos Bruto:</strong> <span style="color: #8b5cf6;">S/ ${item.ingresosBruto?.toLocaleString() || 0}</span></div>
                <div><strong>Precio Promedio:</strong> S/ ${item.precioPromedio?.toFixed(2) || '0.00'}</div>
                <div><strong>Tasa Completación:</strong> ${tasaCompletacion}%</div>
              </div>
            </div>
          `;
        });
      }

      // DOCTOR REPORT
      if (reportType === 'doctor' && reportesDoctor.length > 0) {
        contentHTML += `<h3 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-top: 20px;">Reporte Detallado por Doctor</h3>`;
        reportesDoctor.forEach((item, index) => {
          const especialidades = item.especialidades?.join(', ') || 'N/A';
          contentHTML += `
            <div style="background: #f0fdf4; padding: 15px; margin-bottom: 15px; border-left: 4px solid #10b981; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div>
                  <h4 style="margin: 0; color: #065f46;">${item.nombreCompleto || 'N/A'}</h4>
                  <p style="margin: 5px 0; font-size: 12px; color: #6b7280;">${especialidades}</p>
                </div>
                <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Top ${index + 1}</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 15px;">
                <div><strong>Total Citas:</strong> ${item.totalCitas || 0}</div>
                <div><strong>Completadas:</strong> <span style="color: #10b981;">${item.citasCompletadas || 0}</span></div>
                <div><strong>Canceladas:</strong> <span style="color: #ef4444;">${item.citasCanceladas || 0}</span></div>
                <div><strong>Ingresos Bruto:</strong> <span style="color: #8b5cf6;">S/ ${item.ingresosBruto?.toLocaleString() || 0}</span></div>
                <div><strong>Promedio/Cita:</strong> <span style="color: #f59e0b;">S/ ${item.promedioIngresoPorCita?.toFixed(2) || '0.00'}</span></div>
                <div><strong>Tasa Completación:</strong> ${item.tasaCompletacion || 0}%</div>
              </div>
            </div>
          `;
        });
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Analytics</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
            }
            h3, h4 {
              margin-top: 0;
            }
            @media print {
              body { margin: 15px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Analytics</h1>
            <p style="margin: 5px 0;"><strong>${sedeName}</strong></p>
            <p style="color: #666; margin: 5px 0;">Tipo: ${reportType === 'overview' ? 'Resumen General' : reportType === 'services' ? 'Servicios' : reportType === 'patients' ? 'Pacientes' : reportType === 'consultorio' ? 'Por Consultorio' : reportType === 'especialidad' ? 'Por Especialidad' : 'Por Doctor'}</p>
            <p style="color: #666; margin: 5px 0;">Período: ${dateRange === 'week' ? 'Última Semana' : dateRange === 'month' ? 'Último Mes' : dateRange === '3months' ? 'Últimos 3 Meses' : 'Último Año'}</p>
          </div>

          ${contentHTML}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af;">
            <p>Documento generado el ${new Date().toLocaleString('es-ES')}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      toast.success('Documento PDF generado - Use Ctrl+P para guardar como PDF');
    } catch (error) {
      toast.error('Error al generar PDF');
    }
  };

  // Función para cargar reportes
  const cargarReportes = async () => {
    setLoadingReportes(true);
    setErrorReportes(null);
    try {
      const { inicio, fin } = obtenerRangoFechas(dateRange);
      const sedeId = selectedSede === 'all' ? null : selectedSede;

      // Cargar todos los reportes en paralelo
      // Para reportsApi: usar selectedSede directamente (maneja 'all' internamente)
      // Para otros servicios: usar sedeId (null cuando es 'all')
      const branchIdParam = selectedSede === 'all' ? 'all' : selectedSede;

      const [
        consultorio,
        especialidad,
        doctor,
        estadisticasConsult,
        resumen,
        overviewData,
        servicesData
      ] = await Promise.all([
        EstadisticasOdontologicasService.generarReportePorConsultorio(sedeId, inicio, fin),
        EstadisticasOdontologicasService.generarReportePorEspecialidad(sedeId, inicio, fin),
        EstadisticasOdontologicasService.generarReportePorDoctor(sedeId, inicio, fin),
        EstadisticasConsultoriosService.calcularEstadisticasConsultorios(sedeId, inicio, fin),
        EstadisticasConsultoriosService.getResumenConsultorios(sedeId),
        reportsApi.getOverviewReport(branchIdParam, inicio, fin),
        reportsApi.getServicesReport(branchIdParam, inicio, fin)
      ]);

      setReportesConsultorio(consultorio);
      setReportesEspecialidad(especialidad);
      setReportesDoctor(doctor);
      setEstadisticasConsultorios(estadisticasConsult);
      setResumenConsultorios(resumen);

      // Actualizar datos del reporte principal (Overview, Services, Patients)
      setCurrentReportData({
        appointments: overviewData.appointments,
        patients: overviewData.patients,
        revenue: overviewData.revenue,
        services: servicesData
      });
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      setErrorReportes('No se pudieron cargar los reportes. Por favor, intente nuevamente.');
      toast.error('Error al cargar los reportes');
    } finally {
      setLoadingReportes(false);
    }
  };

  // Cargar reportes cuando cambien los filtros
  useEffect(() => {
    // Solo cargar reportes cuando la sede esté inicializada
    if (sedeInitialized && selectedSede) {
      cargarReportes();
    }
  }, [dateRange, selectedSede, sedeInitialized]);

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart className="w-6 h-6" />
              Reportes y Análisis
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600">Análisis detallado del rendimiento de la clínica</p>
              {canFilterBySede && selectedSede !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  <Building className="w-4 h-4" />
                  {sedesDisponibles.find(sede => sede.id === selectedSede)?.nombre || 'Sede seleccionada'}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <ReportsFilters
          dateRange={dateRange}
          reportType={reportType}
          selectedSede={selectedSede}
          canFilterBySede={canFilterBySede}
          sedesDisponibles={sedesDisponibles}
          onDateRangeChange={setDateRange}
          onReportTypeChange={setReportType}
          onSedeChange={setSelectedSede}
        />

        {/* Error Message */}
        {errorReportes && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{errorReportes}</span>
            </div>
            <button
              onClick={cargarReportes}
              className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        )}

        {/* Report Content */}
        <div>
          {reportType === 'overview' && <OverviewReport data={currentReportData} loading={loadingReportes} />}
          {reportType === 'services' && <ServicesReport data={currentReportData} loading={loadingReportes} />}
          {reportType === 'patients' && <PatientsReport data={currentReportData} loading={loadingReportes} />}
          {reportType === 'revenue' && <RevenueReport data={currentReportData} loading={loadingReportes} />}
          {reportType === 'consultorios' && (
            <ConsultoriosStatisticsReport
              estadisticas={estadisticasConsultorios}
              resumen={resumenConsultorios}
              loading={loadingReportes}
            />
          )}
          {reportType === 'consultorio' && (
            <ConsultorioReport
              reportes={reportesConsultorio}
              loading={loadingReportes}
            />
          )}
          {reportType === 'especialidad' && (
            <EspecialidadReport
              reportes={reportesEspecialidad}
              loading={loadingReportes}
            />
          )}
          {reportType === 'doctor' && (
            <DoctorReport
              reportes={reportesDoctor}
              loading={loadingReportes}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
