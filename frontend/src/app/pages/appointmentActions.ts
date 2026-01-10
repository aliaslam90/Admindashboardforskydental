import { Appointment, AppointmentStatus } from "../data/types";
import { Service } from "../services/servicesApi";
import { appointmentsApi } from "../services/appointmentsApi";
import { toast } from "sonner";

type SetAppointments = React.Dispatch<React.SetStateAction<Appointment[]>>;

export async function updateStatusFlow(params: {
  appointmentId: string;
  newStatus: AppointmentStatus;
  appointments: Appointment[];
  setAppointments: SetAppointments;
  onSuccess?: () => void;
}) {
  const { appointmentId, newStatus, appointments, setAppointments, onSuccess } = params;
  const previous = appointments;

  setAppointments((prev) =>
    prev.map((apt) =>
      apt.id === appointmentId ? { ...apt, status: newStatus, updatedAt: new Date().toISOString() } : apt,
    ),
  );

  try {
    await appointmentsApi.updateStatus(appointmentId, newStatus);
    onSuccess?.();
  } catch (error) {
    console.error("Failed to update appointment status", error);
    setAppointments(previous);
    toast.error("Failed to update appointment status");
  }
}

export async function cancelAppointmentFlow(params: {
  appointmentId: string;
  appointments: Appointment[];
  setAppointments: SetAppointments;
  confirm?: (message: string) => boolean;
}) {
  const { appointmentId, appointments, setAppointments, confirm = window.confirm } = params;
  const appointment = appointments.find((a) => a.id === appointmentId);
  if (!appointment) return;

  const startDate = new Date(`${appointment.date}T${appointment.time}`);
  const now = new Date();
  const isPast = startDate.getTime() <= now.getTime();
  const targetStatus: AppointmentStatus = isPast ? "no-show" : "cancelled";

  const agreed = confirm("Are you sure to cancel the appointment?");
  if (!agreed) return;

  const previous = appointments;
  setAppointments((prev) =>
    prev.map((apt) =>
      apt.id === appointmentId ? { ...apt, status: targetStatus, updatedAt: new Date().toISOString() } : apt,
    ),
  );

  try {
    await appointmentsApi.updateStatus(appointmentId, targetStatus);
    toast.success(`Appointment marked as ${isPast ? "no-show" : "cancelled"}`);
  } catch (error) {
    console.error("Failed to update appointment status", error);
    setAppointments(previous);
    toast.error("Failed to update appointment status");
  }
}

export async function rescheduleAppointmentFlow(params: {
  appointmentId: string | null;
  appointments: Appointment[];
  serviceOptions: Service[];
  rescheduleForm: { date: string; time: string };
  setAppointments: SetAppointments;
  setRescheduleOpen: (value: boolean) => void;
  setRescheduleAppointmentId: (value: string | null) => void;
  setRescheduleForm: (value: { date: string; time: string }) => void;
  setIsRescheduling: (value: boolean) => void;
}) {
  const {
    appointmentId,
    appointments,
    serviceOptions,
    rescheduleForm,
    setAppointments,
    setRescheduleOpen,
    setRescheduleAppointmentId,
    setRescheduleForm,
    setIsRescheduling,
  } = params;

  if (!rescheduleForm.date || !rescheduleForm.time) {
    toast.error("Please select both date and time");
    return;
  }

  if (!appointmentId) {
    toast.error("No appointment selected");
    return;
  }

  const target = appointments.find((a) => a.id === appointmentId);
  if (!target) {
    toast.error("Appointment not found");
    return;
  }

  const serviceDuration = serviceOptions.find((s) => s.id === target.serviceId)?.duration ?? 30;
  const startDate = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`);

  if (Number.isNaN(startDate.getTime())) {
    toast.error("Invalid date or time");
    return;
  }

  const now = new Date();
  if (startDate.getTime() <= now.getTime()) {
    toast.error("Cannot reschedule to a past time");
    return;
  }

  const endDate = new Date(startDate.getTime() + serviceDuration * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const formatLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const start = formatLocal(startDate);
  const end = formatLocal(endDate);

  setIsRescheduling(true);
  try {
    const updated = await appointmentsApi.update(appointmentId, {
      start_datetime: start,
      end_datetime: end,
    });

    setAppointments((prev) => prev.map((apt) => (apt.id === appointmentId ? { ...updated } : apt)));

    toast.success("Appointment rescheduled successfully");
    setRescheduleOpen(false);
    setRescheduleAppointmentId(null);
    setRescheduleForm({ date: "", time: "" });
  } catch (error) {
    console.error("Failed to reschedule appointment", error);
    const rawMessage = error instanceof Error && error.message ? error.message : "Failed to reschedule appointment";
    const lower = rawMessage.toLowerCase();
    const friendlyMessage = lower.includes("already has an appointment")
      ? "This doctor already has an appointment in that time range. Please choose another time."
      : rawMessage;
    toast.error(friendlyMessage);
  } finally {
    setIsRescheduling(false);
  }
}

