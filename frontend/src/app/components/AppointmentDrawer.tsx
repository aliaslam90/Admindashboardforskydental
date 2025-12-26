import { useState } from 'react';
import { X, Phone, Calendar, Clock, User, Stethoscope, ClipboardList, CheckCircle2, UserCheck, Ban, Edit } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { StatusBadge } from './StatusBadge';
import { Separator } from './ui/separator';
import { Appointment, getPatientById } from '../data/mockData';
import { toast } from 'sonner';

interface AppointmentDrawerProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onConfirm?: (id: string) => void;
  onCheckIn?: (id: string) => void;
  onComplete?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function AppointmentDrawer({ 
  appointment, 
  open, 
  onClose,
  onConfirm,
  onCheckIn,
  onComplete,
  onReschedule,
  onCancel
}: AppointmentDrawerProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!appointment) return null;

  const patient = getPatientById(appointment.patientId);

  const handleAction = async (action: () => void, successMessage: string) => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    action();
    toast.success(successMessage);
    setIsProcessing(false);
    onClose();
  };

  const canConfirm = appointment.status === 'booked';
  const canCheckIn = appointment.status === 'confirmed' || appointment.status === 'booked';
  const canComplete = appointment.status === 'checked-in' || appointment.status === 'confirmed';
  const canReschedule = appointment.status !== 'completed' && appointment.status !== 'cancelled';
  const canCancel = appointment.status !== 'completed' && appointment.status !== 'cancelled';

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Appointment Details</SheetTitle>
          <SheetDescription>Manage the appointment status and actions.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Current Status</span>
            <StatusBadge status={appointment.status} />
          </div>

          <Separator />

          {/* Patient Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Patient Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{appointment.patientName}</p>
                  {patient && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{patient.totalVisits} visits</span>
                      {patient.flags.includes('vip') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          VIP
                        </span>
                      )}
                      {patient.flags.includes('no-show-risk') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          No-show Risk
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <a href={`tel:${appointment.phone}`} className="text-sm text-blue-600 hover:text-blue-700">
                  {appointment.phone}
                </a>
              </div>
            </div>
          </div>

          <Separator />

          {/* Appointment Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Appointment Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-900">
                    {new Date(appointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <p className="text-sm text-gray-900">{appointment.time}</p>
              </div>

              <div className="flex items-center gap-3">
                <Stethoscope className="h-5 w-5 text-gray-400" />
                <p className="text-sm text-gray-900">{appointment.doctorName}</p>
              </div>

              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-gray-400" />
                <p className="text-sm text-gray-900">{appointment.serviceName}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Internal Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {appointment.notes}
                </p>
              </div>
            </>
          )}

          {/* Timeline */}
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Status Timeline</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Appointment Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(appointment.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              {appointment.updatedAt !== appointment.createdAt && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-xs text-gray-500">
                      {new Date(appointment.updatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Actions</h3>
            
            {canConfirm && onConfirm && (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleAction(
                  () => onConfirm(appointment.id),
                  'Appointment confirmed successfully'
                )}
                disabled={isProcessing}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Appointment
              </Button>
            )}

            {canCheckIn && onCheckIn && (
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => handleAction(
                  () => onCheckIn(appointment.id),
                  'Patient checked in successfully'
                )}
                disabled={isProcessing}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Check In Patient
              </Button>
            )}

            {canComplete && onComplete && (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handleAction(
                  () => onComplete(appointment.id),
                  'Appointment marked as completed'
                )}
                disabled={isProcessing}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
            )}

            {canReschedule && onReschedule && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  onReschedule(appointment.id);
                  onClose();
                }}
                disabled={isProcessing}
              >
                <Edit className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
            )}

            {canCancel && onCancel && (
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  onCancel(appointment.id);
                  onClose();
                }}
                disabled={isProcessing}
              >
                <Ban className="h-4 w-4 mr-2" />
                Cancel Appointment
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}