import { useEffect, useMemo, useState } from 'react';
import { Search, Calendar, Phone, Mail, User, ChevronRight, Flag } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Patient, Appointment } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { patientsApi } from '../services/patientsApi';
import { appointmentsApi } from '../services/appointmentsApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';

type PatientStats = {
  totalVisits: number;
  lastVisit: string | null;
  noShows: number;
  cancellations: number;
};

const defaultStats: PatientStats = {
  totalVisits: 0,
  lastVisit: null,
  noShows: 0,
  cancellations: 0,
};

function toDate(appointment: Appointment) {
  return new Date(`${appointment.date}T${appointment.time}`);
}

function buildPatientStats(appointmentList: Appointment[]): Record<string, PatientStats> {
  return appointmentList.reduce<Record<string, PatientStats>>((acc, apt) => {
    const stats = acc[apt.patientId] ?? { ...defaultStats };

    stats.totalVisits += 1;

    const visitDate = toDate(apt);
    if (!stats.lastVisit || visitDate > new Date(stats.lastVisit)) {
      stats.lastVisit = visitDate.toISOString();
    }

    if (apt.status === 'no-show') stats.noShows += 1;
    if (apt.status === 'cancelled') stats.cancellations += 1;

    acc[apt.patientId] = stats;
    return acc;
  }, {});
}

function deriveFlags(stats: PatientStats): Patient['flags'] {
  const flags: Patient['flags'] = [];
  if (stats.totalVisits >= 10) flags.push('vip');
  if (stats.noShows > 0 || stats.cancellations > 1) flags.push('no-show-risk');
  return flags;
}

export function Patients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const [patientRes, appointmentRes] = await Promise.all([
        patientsApi.getAll(),
        appointmentsApi.getAll(),
      ]);

      const stats = buildPatientStats(appointmentRes);
      const hydratedPatients = patientRes.map(p => {
        const s = stats[p.id] ?? { ...defaultStats };
        return { ...p, totalVisits: s.totalVisits, lastVisit: s.lastVisit || '', flags: deriveFlags(s) };
      });

      setPatients(hydratedPatients);
      setAppointments(appointmentRes);
    } catch (error) {
      console.error('Failed to load patients', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(query) ||
      patient.phone.toLowerCase().includes(query) ||
      patient.id.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query)
    );
  }, [searchQuery, patients]);

  const handleOpenPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const getPatientAppointments = (patientId: string) => {
    return appointments
      .filter(apt => apt.patientId === patientId)
      .sort((a, b) => toDate(b).getTime() - toDate(a).getTime());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500 mt-1">View patient history and information</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredPatients.length} Patient{filteredPatients.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner message="Loading patients..." />
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No patients found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Total Visits</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map(patient => (
                    <TableRow 
                      key={patient.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleOpenPatient(patient)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-500">ID: {patient.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{patient.phone}</TableCell>
                      <TableCell className="text-sm text-gray-900 font-medium">{patient.totalVisits}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(patient.lastVisit).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {patient.flags.includes('vip') && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              VIP
                            </Badge>
                          )}
                          {patient.flags.includes('no-show-risk') && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                              Risk
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Profile</DialogTitle>
            <DialogDescription>View and manage patient details and appointments.</DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6 mt-4">
              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedPatient.name}</p>
                      <p className="text-xs text-gray-500">Patient ID: {selectedPatient.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${selectedPatient.phone}`} className="text-sm text-blue-600 hover:text-blue-700">
                      {selectedPatient.phone}
                    </a>
                  </div>
                  {selectedPatient.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <a href={`mailto:${selectedPatient.email}`} className="text-sm text-blue-600 hover:text-blue-700">
                        {selectedPatient.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Total Visits</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedPatient.totalVisits}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Last Visit</p>
                  <p className="text-lg font-semibold text-green-700">
                    {new Date(selectedPatient.lastVisit).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Flags */}
              {selectedPatient.flags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Patient Flags
                    </h3>
                    <div className="flex gap-2">
                      {selectedPatient.flags.includes('vip') && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          VIP Patient
                        </Badge>
                      )}
                      {selectedPatient.flags.includes('no-show-risk') && (
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                          No-show Risk
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {selectedPatient.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Internal Notes</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedPatient.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Appointment History */}
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Appointment History
                </h3>
                <div className="space-y-3">
                  {getPatientAppointments(selectedPatient.id).map(apt => (
                    <div key={apt.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="text-xs text-gray-500">
                          {new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {new Date(apt.date).getDate()}
                        </div>
                        <div className="text-xs text-gray-500">{apt.time}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{apt.serviceName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{apt.doctorName}</p>
                        {apt.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">{apt.notes}</p>
                        )}
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}