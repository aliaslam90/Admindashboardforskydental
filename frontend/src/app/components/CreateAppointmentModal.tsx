import { useEffect, useMemo, useState } from "react";
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
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { appointmentsApi } from "../services/appointmentsApi";
import { Doctor } from "../data/types";
import { Service } from "../services/servicesApi";

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
  const [availableSlots, setAvailableSlots] = useState<
    { start: string; end: string; date: string; time: string }[]
  >([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);

  const filteredServices = useMemo(() => {
    if (!form.doctorId) return serviceOptions.filter((s) => s.active);
    const doctor = doctorOptions.find((d) => d.id === form.doctorId);
    if (!doctor || !doctor.services?.length) return [];
    const allowed = new Set(doctor.services.map(String));
    return serviceOptions.filter((s) => s.active && allowed.has(s.id));
  }, [form.doctorId, doctorOptions, serviceOptions]);

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyForm,
        ...initialValues,
      });
      setAvailableSlots([]);
      setSlotsError(null);
    }
  }, [open, initialValues]);

  useEffect(() => {
    if (form.serviceId && !filteredServices.some((s) => s.id === form.serviceId)) {
      setForm((prev) => ({ ...prev, serviceId: "" }));
    }
  }, [filteredServices, form.serviceId]);

  // Load available slots whenever doctor + service are selected
  useEffect(() => {
    const loadSlots = async () => {
      if (!form.doctorId || !form.serviceId) {
        setAvailableSlots([]);
        setSlotsError(null);
        return;
      }
      setIsLoadingSlots(true);
      setSlotsError(null);
      try {
        const slots = await appointmentsApi.getAvailability({
          doctorId: form.doctorId,
          serviceId: form.serviceId,
        });
        // Debug: Log all slots to verify both ranges are included
        console.log("All available slots:", slots);
        setAvailableSlots(slots);
        // If current selected date/time are no longer valid, clear them
        if (
          form.date &&
          !slots.some((s) => s.date === form.date)
        ) {
          setForm((prev) => ({ ...prev, date: "", time: "" }));
        } else if (
          form.date &&
          form.time &&
          !slots.some((s) => s.date === form.date && s.time === form.time)
        ) {
          setForm((prev) => ({ ...prev, time: "" }));
        }
      } catch (err) {
        console.error("Failed to load availability", err);
        setSlotsError("Could not load availability for this doctor/service.");
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    void loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.doctorId, form.serviceId]);

  const availableDates = useMemo(
    () => Array.from(new Set(availableSlots.map((s) => s.date))),
    [availableSlots],
  );

  // Convert selected date string to Date object
  const selectedDate = useMemo(() => {
    if (!form.date) return undefined;
    const [year, month, day] = form.date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [form.date]);

  // Disable dates that aren't available
  const isDateDisabled = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return !availableDates.includes(dateStr);
  };

  const availableTimesForDate = useMemo(
    () => {
      if (!form.date) return [];
      // Get all slots for the selected date
      const slotsForDate = availableSlots.filter((s) => s.date === form.date);
      // Debug: Log slots for selected date
      console.log(`Slots for date ${form.date}:`, slotsForDate);
      
      // Get all unique times for the selected date, sorted
      const times = Array.from(
        new Set(slotsForDate.map((s) => s.time))
      ).sort((a, b) => {
        // Sort by time (HH:MM format)
        const [h1, m1] = a.split(":").map(Number);
        const [h2, m2] = b.split(":").map(Number);
        return h1 * 60 + m1 - (h2 * 60 + m2);
      });
      
      // Filter out past times if the selected date is today
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const now = new Date();
      
      if (form.date === todayStr) {
        // Filter out times that have already passed
        // Include the current time slot if it's available
        const futureTimes = times.filter((time) => {
          // Create a datetime for this specific time slot by combining date and time
          // Time is already in HH:MM format, so we can use it directly
          const slotDateTime = new Date(`${form.date}T${time}`);
          // Include times that are in the future or exactly at the current time
          return slotDateTime.getTime() >= now.getTime();
        });
        
        // Debug: Log final times (after filtering past times)
        console.log(`Available times for ${form.date} (after filtering past):`, futureTimes);
        return futureTimes;
      }
      
      // Debug: Log final times
      console.log(`Available times for ${form.date}:`, times);
      return times;
    },
    [availableSlots, form.date],
  );

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
                <Label htmlFor="appointment-phone">Phone Number *</Label>
                <Input
                  id="appointment-phone"
                  name="appointment-phone"
                  type="tel"
                  autoComplete="tel"
                  data-lpignore="false"
                  data-form-type="other"
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
                      serviceId: "",
                      date: "",
                      time: "",
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
                  disabled={isSubmitting || !form.doctorId || filteredServices.length === 0}
                >
                  <SelectTrigger
                    id="service"
                    disabled={
                      isSubmitting || !form.doctorId || filteredServices.length === 0
                    }
                  >
                    <SelectValue
                      placeholder={
                        !form.doctorId
                          ? "Select doctor first"
                          : filteredServices.length === 0
                          ? "No services for this doctor"
                          : "Select service"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServices.map((service) => (
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
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={
                        isSubmitting ||
                        !form.doctorId ||
                        !form.serviceId ||
                        availableDates.length === 0 ||
                        isLoadingSlots
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP")
                      ) : (
                        <span className="text-muted-foreground">
                          {!form.doctorId || !form.serviceId
                            ? "Select doctor & service"
                            : isLoadingSlots
                            ? "Loading..."
                            : availableDates.length === 0
                            ? "No dates available"
                            : "Pick a date"}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = format(date, "yyyy-MM-dd");
                          setForm({
                            ...form,
                            date: dateStr,
                            time: "",
                          });
                          setCalendarOpen(false);
                        }
                      }}
                      disabled={(date) => {
                        // Disable past dates
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return true;
                        // Disable dates not in availableDates
                        return isDateDisabled(date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <div className="relative">
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
                    disabled={
                      isSubmitting ||
                      !form.date ||
                      availableTimesForDate.length === 0 ||
                      isLoadingSlots
                    }
                    className="pr-10"
                    list={form.date && availableTimesForDate.length > 0 ? `available-times-${form.date}` : undefined}
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                  {form.date && availableTimesForDate.length > 0 && (
                    <datalist id={`available-times-${form.date}`}>
                      {availableTimesForDate.map((time) => (
                        <option key={time} value={time} />
                      ))}
                    </datalist>
                  )}
                </div>
                {form.date && availableTimesForDate.length > 0 && (
                  <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        View all available times ({availableTimesForDate.length})
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <div className="max-h-48 overflow-y-auto">
                        <p className="text-xs font-medium mb-2">Available times:</p>
                        <div className="grid grid-cols-3 gap-1">
                          {availableTimesForDate.map((time) => {
                            // Convert 24-hour format (HH:mm) to 12-hour format with AM/PM
                            const [hours, minutes] = time.split(':').map(Number);
                            const date = new Date();
                            date.setHours(hours, minutes, 0, 0);
                            const time12Hour = format(date, 'h:mm a');
  
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    time: time,
                                  });
                                  setTimePopoverOpen(false);
                                }}
                                className={`text-xs px-2 py-1 rounded border ${
                                  form.time === time
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                              >
                                {time12Hour}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {!form.date && (
                  <p className="text-xs text-muted-foreground">Select date first</p>
                )}
                {form.date && isLoadingSlots && (
                  <p className="text-xs text-muted-foreground">Loading availability...</p>
                )}
                {form.date && !isLoadingSlots && availableTimesForDate.length === 0 && (
                  <p className="text-xs text-red-500">No times available for this date</p>
                )}
              </div>
            </div>

            {slotsError && (
              <p className="text-sm text-red-500">{slotsError}</p>
            )}

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

