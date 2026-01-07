import { useEffect, useMemo, useState } from 'react';
import { User, Phone, Mail, Calendar, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Appointment, Doctor, Patient } from '../../data/mockData';
import { appointmentsApi } from '../../services/appointmentsApi';
import { patientsApi } from '../../services/patientsApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { toast } from 'sonner';

interface DoctorPatientsProps {
  currentDoctor: Doctor;
}

export function DoctorPatients({ currentDoctor }: DoctorPatientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentDoctor.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appts, patientRes] = await Promise.all([
        appointmentsApi.getAll({ doctorId: currentDoctor.id }),
        patientsApi.getAll(),
      ]);
      const patientMap = new Map(patientRes.map(p => [p.id, p]));
      setAppointments(appts);
      setPatients(derivePatients(appts, currentDoctor.id, patientMap));
    } catch (error) {
      console.error('Failed to load doctor patients', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const derivePatients = (
    appts: Appointment[],
    doctorId: string,
    patientMap: Map<string, Patient>,
  ): Patient[] => {
    const map = new Map<string, Patient>();
    appts
      .filter(a => a.doctorId === doctorId)
      .forEach(a => {
        if (!map.has(a.patientId)) {
          const pInfo = patientMap.get(a.patientId);
          map.set(a.patientId, {
            id: a.patientId,
            name: a.patientName,
            phone: a.phone,
            email: pInfo?.email || '',
            totalVisits: 0,
            lastVisit: '',
            flags: [],
            notes: '',
          });
        }
        const p = map.get(a.patientId)!;
        p.totalVisits += 1;
        const date = a.date;
        if (!p.lastVisit || date > p.lastVisit) p.lastVisit = date;
      });

    // Derive flags: VIP if >=10 visits, risk if any cancelled/no-show
    appts.forEach(a => {
      const p = map.get(a.patientId);
      if (!p) return;
      if (a.status === 'cancelled' || a.status === 'no-show') {
        if (!p.flags.includes('no-show-risk')) p.flags.push('no-show-risk');
      }
    });
    map.forEach(p => {
      if (p.totalVisits >= 10 && !p.flags.includes('vip')) p.flags.push('vip');
    });

    return Array.from(map.values());
  };

  const getPatientAppointments = (patientId: string) => {
    return appointments.filter(
      apt => apt.patientId === patientId && apt.doctorId === currentDoctor.id
    );
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [patients, searchQuery]);

  const handleViewPatient = (patient: any) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Patients</h1>
        <p className="text-sm text-gray-500 mt-1">Patients who have visited you</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-semibold text-gray-900">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">VIP Patients</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {patients.filter(p => p.flags.includes('vip')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {appointments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <LoadingSpinner message="Loading patients..." />
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map(patient => {
                const appointments = getPatientAppointments(patient.id);
                const completedVisits = appointments.filter(apt => apt.status === 'completed').length;

                return (
                  <Card 
                    key={patient.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewPatient(patient)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-blue-700">
                              {patient.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{patient.name}</h3>
                              {patient.flags.map((flag: string) => (
                                <Badge 
                                  key={flag}
                                  variant={flag === 'vip' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {flag === 'vip' ? '⭐ VIP' : '⚠️ No-show Risk'}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {patient.phone}
                              </p>
                              {patient.email && (
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {patient.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{completedVisits} visits</p>
                          <p className="text-xs text-gray-500 mt-1">with you</p>
                        </div>
                      </div>
                      
                      {patient.notes && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800 border border-yellow-200">
                          <span className="font-medium">Note:</span> {patient.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchQuery ? 'No patients found matching your search' : 'No patients yet'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              Complete patient information and visit history
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium text-blue-700">
                    {selectedPatient.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900">{selectedPatient.name}</h3>
                    {selectedPatient.flags.map((flag: string) => (
                      <Badge key={flag} variant={flag === 'vip' ? 'default' : 'secondary'}>
                        {flag === 'vip' ? '⭐ VIP' : '⚠️ No-show Risk'}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedPatient.phone}
                    </p>
                    {selectedPatient.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedPatient.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedPatient.notes && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-900">
                    <span className="font-medium">Important Note:</span> {selectedPatient.notes}
                  </p>
                </div>
              )}

              {/* Appointment History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Appointment History with You</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getPatientAppointments(selectedPatient.id).map(apt => (
                    <div key={apt.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{apt.serviceName}</p>
                          <p className="text-gray-600">
                            {new Date(apt.date).toLocaleDateString()} at {apt.time}
                          </p>
                        </div>
                        <Badge className={
                          apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {apt.status}
                        </Badge>
                      </div>
                      {apt.notes && (
                        <p className="text-gray-600 mt-2 text-xs">{apt.notes}</p>
                      )}
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
