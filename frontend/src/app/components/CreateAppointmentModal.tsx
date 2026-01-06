import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { appointmentsApi } from "../services/appointmentsApi";
import { Doctor, Service } from "../data/mockData";

export type CreateAppointmentForm = {
  patientName: string;
  phone: string;
  email: string;
  doctorId: string;
  serviceId: string;
  date: string;
  time: string;
  notes: string;
};

export type CreateAppointmentPrefill = Partial<CreateAppointmentForm>;

type CreateAppointmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorOptions: Doctor[];
  serviceOptions: Service[];
  onCreated: () => void;
  initialValues?: CreateAppointmentPrefill;
};

const pad = (n: number) => n.toString().padStart(2, "0");
const formatLocalDateTime = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;

export function CreateAppointmentModal({
  open,
  onOpenChange,
  doctorOptions,
  serviceOptions,
  onCreated,
  initialValues,
}: CreateAppointmentModalProps) {
  const emptyForm: CreateAppointmentForm = {
    patientName: "",
    phone: "",
    email: "",
    doctorId: "",
    serviceId: "",
    date: "",
    time: "",
    notes: "",
  };

  const [form, setForm] = useState<CreateAppointmentForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyForm,
        ...initialValues,
      });
    }
  }, [open, initialValues]);

  const handleSave = async () => {
    if (!form.patientName.trim()) {
      toast.error("Patient name is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!form.doctorId) {
      toast.error("Please select a doctor");
      return;
    }
    if (!form.serviceId) {
      toast.error("Please select a service");
      return;
    }
    if (!form.date) {
      toast.error("Please select a date");
      return;
    }
    if (!form.time) {
      toast.error("Please select a time");
      return;
    }

    const doctor = doctorOptions.find((d) => d.id === form.doctorId);
    const service = serviceOptions.find((s) => s.id === form.serviceId);

    if (!doctor || !service) {
      toast.error("Invalid doctor or service selected");
      return;
    }

    const startDate = new Date(`${form.date}T${form.time}`);
    const now = new Date();
    if (startDate.getTime() <= now.getTime()) {
      toast.error("Appointment time must be in the future");
      return;
    }

    const endDate = new Date(startDate.getTime() + (service.duration ?? 30) * 60 * 1000);

    setIsSubmitting(true);
    try {
      const created = await appointmentsApi.create({
        patient: {
          full_name: form.patientName,
          phone_number: form.phone,
          email: form.email,
        },
        doctor_id: parseInt(form.doctorId, 10),
        service_id: parseInt(form.serviceId, 10),
        start_datetime: formatLocalDateTime(startDate),
        end_datetime: formatLocalDateTime(endDate),
        status: "booked",
        notes: form.notes,
      });

      if (!created) {
        toast.error("Appointment could not be created (empty response).");
        return;
      }

      toast.success("Appointment created");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      console.error("Failed to create appointment", error);
      const rawMessage =
        error instanceof Error && error.message
          ? error.message
          : "Failed to create appointment";
      const lower = rawMessage.toLowerCase();
      const friendlyMessage = lower.includes("already has an appointment")
        ? "This doctor already has an appointment in that time range. Please choose another time."
        : rawMessage;
      toast.error(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details to book a new appointment for the patient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Patient Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patient-name">Patient Name *</Label>
                <Input
                  id="patient-name"
                  value={form.patientName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      patientName: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  placeholder="Enter patient name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  placeholder="+971-XX-XXX-XXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="patient@email.com"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-medium text-gray-900">
              Appointment Details
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor *</Label>
                <Select
                  value={form.doctorId}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      doctorId: value,
                    })
                  }
                >
                  <SelectTrigger
                    id="doctor"
                    disabled={isSubmitting || doctorOptions.length === 0}
                  >
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorOptions
                      .filter((d) => d.status === "active")
                      .map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select
                  value={form.serviceId}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      serviceId: value,
                    })
                  }
                >
                  <SelectTrigger
                    id="service"
                    disabled={isSubmitting || serviceOptions.length === 0}
                  >
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions
                      .filter((s) => s.active)
                      .map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.duration} min)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      time: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
                disabled={isSubmitting}
                placeholder="Add any special instructions or notes..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

