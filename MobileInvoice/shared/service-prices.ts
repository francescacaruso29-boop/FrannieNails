export const SERVICE_PRICES: Record<string, number> = {
  "Gel": 25,
  "Ricostruzione": 45,
  "Semipermanente": 15,
  "Semipermanente Piedi": 15,
  "Gel + Semipermanente": 40,
  "Semplicemente mani e piedi": 30,
  "Unghia rotta": 2
};

export function getServicePrice(serviceName: string): number {
  return SERVICE_PRICES[serviceName] || 0;
}

export function calculateAppointmentCost(appointments: Array<{ service: string }>): number {
  return appointments.reduce((total, apt) => total + getServicePrice(apt.service), 0);
}