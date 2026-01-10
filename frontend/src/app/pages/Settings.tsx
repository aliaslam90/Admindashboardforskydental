import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Clock, Calendar, Shield, Link2, User, LogOut, Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Admin, AdminRole } from '../data/types';
import { toast } from 'sonner';
import { settingsApi } from '../services/settingsApi';
import { usersApi } from '../services/usersApi';

interface SettingsProps {
  currentAdmin?: Admin;
  onLogout: () => void;
}

export function Settings({ currentAdmin, onLogout }: SettingsProps) {
  const fallbackAdmin: Admin = currentAdmin ?? {
    id: 'admin-local',
    name: 'Admin',
    email: 'admin@example.com',
    phone: '',
    role: 'super-admin',
    status: 'active',
    permissions: {
      dashboard: true,
      appointments: true,
      calendar: true,
      patients: true,
      doctors: true,
      services: true,
      notifications: true,
      settings: true,
      adminManagement: true
    },
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [bufferTime, setBufferTime] = useState('15');
  const [cancellationWindow, setCancellationWindow] = useState('24');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState('5');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [workingDays, setWorkingDays] = useState<string[]>(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean; type: string} | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [editAdminOpen, setEditAdminOpen] = useState(false);
  const [deleteAdminOpen, setDeleteAdminOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([fallbackAdmin]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Form State
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'appointment-manager' as AdminRole
  });

  // Fetch appointment settings and admins on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const [settings, users] = await Promise.all([
          settingsApi.getAppointmentSettings(),
          usersApi.getAll(),
        ]);
        
        setBufferTime(settings.buffer_minutes.toString());
        setCancellationWindow(settings.cancellation_window_hours.toString());
        setOtpRequired(settings.otp_required);
        setOtpExpiry(settings.otp_expiry_minutes.toString());
        setOpeningTime(settings.opening_time || '09:00');
        setClosingTime(settings.closing_time || '18:00');
        setWorkingDays(settings.working_days || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
        setCalendarConnected(settings.calendar_connected ?? false);
        
        // Convert backend users to Admin format for display
        const adminUsers: Admin[] = users
          .filter(user => user.role === 'admin' || user.role === 'manager' || user.role === 'receptionist')
          .map(user => ({
            id: user.id,
            name: user.full_name,
            email: user.email,
            phone: user.phone_number,
            role: (user.role === 'admin' ? 'super-admin' : user.role === 'manager' ? 'manager' : 'receptionist') as AdminRole,
            status: (user.is_active ? 'active' : 'inactive') as 'active' | 'inactive',
            permissions: {
              dashboard: true,
              appointments: true,
              calendar: true,
              patients: true,
              doctors: true,
              services: true,
              notifications: true,
              settings: user.role === 'admin',
              adminManagement: user.role === 'admin',
            },
            lastLogin: user.last_login || undefined,
            createdAt: user.created_at,
          }));
        
        setAdmins(adminUsers.length > 0 ? adminUsers : [fallbackAdmin]);
      } catch (error) {
        console.error('Failed to load settings', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveWorkingHours = async () => {
    try {
      setIsSubmitting(true);
      await settingsApi.updateAppointmentSettings({
        opening_time: openingTime,
        closing_time: closingTime,
        working_days: workingDays,
      });
      toast.success('Working hours updated', {
        description: 'Clinic working hours have been saved successfully'
      });
    } catch (error) {
      console.error('Failed to update working hours', error);
      toast.error('Failed to update working hours', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveBufferTime = async () => {
    try {
      setIsSubmitting(true);
      await settingsApi.updateAppointmentSettings({
        buffer_minutes: parseInt(bufferTime, 10),
      });
      toast.success('Buffer time updated', {
        description: 'Changes will affect future appointments only'
      });
      setConfirmDialog(null);
    } catch (error) {
      console.error('Failed to update buffer time', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update buffer time');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCancellationWindow = async () => {
    try {
      setIsSubmitting(true);
      await settingsApi.updateAppointmentSettings({
        cancellation_window_hours: parseInt(cancellationWindow, 10),
      });
      toast.success('Cancellation window updated');
      setConfirmDialog(null);
    } catch (error) {
      console.error('Failed to update cancellation window', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update cancellation window');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveOtpSettings = async () => {
    try {
      setIsSubmitting(true);
      await settingsApi.updateAppointmentSettings({
        otp_required: otpRequired,
        otp_expiry_minutes: parseInt(otpExpiry, 10),
      });
      toast.success('OTP settings updated');
      setConfirmDialog(null);
    } catch (error) {
      console.error('Failed to update OTP settings', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update OTP settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnectCalendar = () => {
    setConfirmDialog({ open: true, type: 'calendar' });
  };

  const handleSaveCalendarConnection = async (connected: boolean) => {
    try {
      setIsSubmitting(true);
      await settingsApi.updateAppointmentSettings({
        calendar_connected: connected,
      });
      setCalendarConnected(connected);
      toast.success(connected ? 'Calendar connected' : 'Calendar disconnected', {
        description: connected 
          ? 'New appointments will sync with your calendar'
          : 'New appointments will no longer sync'
      });
    } catch (error) {
      console.error('Failed to update calendar connection', error);
      toast.error('Failed to update calendar connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (confirmDialog?.type === 'buffer') {
      handleSaveBufferTime();
    } else if (confirmDialog?.type === 'cancellation') {
      handleSaveCancellationWindow();
    } else if (confirmDialog?.type === 'otp') {
      handleSaveOtpSettings();
    } else if (confirmDialog?.type === 'calendar') {
      handleSaveCalendarConnection(false);
      setConfirmDialog(null);
    }
  };

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const handleAddAdmin = () => {
    setAddAdminOpen(true);
  };

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setAdminForm({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role
    });
    setEditAdminOpen(true);
  };

  const handleDeleteAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setDeleteAdminOpen(true);
  };

  const handleAdminFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Map frontend role to backend role
      const backendRole = adminForm.role === 'super-admin' ? 'admin' : 
                         adminForm.role === 'appointment-manager' ? 'admin' :
                         adminForm.role === 'manager' ? 'manager' :
                         adminForm.role === 'receptionist' ? 'receptionist' : 'admin';
      
      const newUser = await usersApi.create({
        email: adminForm.email,
        password: 'TempPassword123!', // Default password - should be changed on first login
        full_name: adminForm.name,
        phone_number: adminForm.phone,
        role: backendRole,
        is_active: true,
        email_verified: false,
      });
      
      // Convert to Admin format and add to list
      const newAdmin: Admin = {
        id: newUser.id,
        name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone_number,
        role: newUser.role === 'admin' ? 'super-admin' : newUser.role === 'manager' ? 'manager' : 'receptionist',
        status: newUser.is_active ? 'active' : 'inactive',
        permissions: {
          dashboard: true,
          appointments: true,
          calendar: true,
          patients: true,
          doctors: true,
          services: true,
          notifications: true,
          settings: newUser.role === 'admin',
          adminManagement: newUser.role === 'admin',
        },
        lastLogin: newUser.last_login || undefined,
        createdAt: newUser.created_at,
      };
      
      setAdmins(prev => [...prev, newAdmin]);
      toast.success('Admin added successfully', {
        description: 'Default password: TempPassword123! - Please change on first login'
      });
      setAddAdminOpen(false);
      setAdminForm({ name: '', email: '', phone: '', role: 'appointment-manager' });
    } catch (error) {
      console.error('Failed to add admin', error);
      toast.error('Failed to add admin', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    try {
      // Map frontend role to backend role
      const backendRole = adminForm.role === 'super-admin' ? 'admin' : 
                         adminForm.role === 'appointment-manager' ? 'admin' :
                         adminForm.role === 'manager' ? 'manager' :
                         adminForm.role === 'receptionist' ? 'receptionist' : 'admin';
      
      const updatedUser = await usersApi.update(selectedAdmin.id, {
        email: adminForm.email,
        full_name: adminForm.name,
        phone_number: adminForm.phone,
        role: backendRole,
      });
      
      // Convert to Admin format and update list
      const updatedAdmin: Admin = {
        id: updatedUser.id,
        name: updatedUser.full_name,
        email: updatedUser.email,
        phone: updatedUser.phone_number,
        role: updatedUser.role === 'admin' ? 'super-admin' : updatedUser.role === 'manager' ? 'manager' : 'receptionist',
        status: updatedUser.is_active ? 'active' : 'inactive',
        permissions: {
          dashboard: true,
          appointments: true,
          calendar: true,
          patients: true,
          doctors: true,
          services: true,
          notifications: true,
          settings: updatedUser.role === 'admin',
          adminManagement: updatedUser.role === 'admin',
        },
        lastLogin: updatedUser.last_login || undefined,
        createdAt: updatedUser.created_at,
      };
      
      setAdmins(prev => prev.map(admin => admin.id === selectedAdmin.id ? updatedAdmin : admin));
      toast.success('Admin updated successfully');
      setEditAdminOpen(false);
      setSelectedAdmin(null);
    } catch (error) {
      console.error('Failed to update admin', error);
      toast.error('Failed to update admin', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    try {
      await usersApi.delete(selectedAdmin.id);
      setAdmins(prev => prev.filter(admin => admin.id !== selectedAdmin.id));
      toast.success('Admin deleted successfully');
      setDeleteAdminOpen(false);
      setSelectedAdmin(null);
    } catch (error) {
      console.error('Failed to delete admin', error);
      toast.error('Failed to delete admin', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure system rules and preferences</p>
      </div>

      {/* Admin Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>Your account information and quick actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900">{fallbackAdmin.name}</h3>
                <p className="text-sm text-gray-600">{fallbackAdmin.email}</p>
                <p className="text-sm text-gray-500">{fallbackAdmin.phone}</p>
                <Badge variant={fallbackAdmin.role === 'super-admin' ? 'default' : 'secondary'} className="mt-2">
                  {fallbackAdmin.role === 'super-admin' ? 'Super Admin' : 'Appointment Manager'}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Management - Only for Super Admin */}
      {currentAdmin?.permissions?.adminManagement && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <CardTitle>Admin Management</CardTitle>
                  <CardDescription>Manage administrator accounts and roles</CardDescription>
                </div>
              </div>
              <Button onClick={handleAddAdmin} className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A]">
                <Plus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{admin.email}</TableCell>
                      <TableCell className="text-sm text-gray-600">{admin.phone}</TableCell>
                      <TableCell>
                        <Badge variant={admin.role === 'super-admin' ? 'default' : 'secondary'}>
                          {admin.role === 'super-admin' ? 'Super Admin' : 'Appointment Manager'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.status === 'active' ? 'default' : 'secondary'}>
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAdmin(admin)}
                            disabled={admin.id === currentAdmin.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAdmin(admin)}
                            disabled={admin.id === currentAdmin.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Role Permissions:</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div>
                  <strong>Super Admin:</strong> Full access to all features including admin management, settings, and all modules
                </div>
                <div>
                  <strong>Appointment Manager:</strong> Can create/manage appointments, view patients, manage doctors and services, but cannot manage other admins
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinic Working Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle>Clinic Working Hours</CardTitle>
              <CardDescription>Set your clinic's operating hours</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="open-time">Opening Time</Label>
              <Input
                id="open-time"
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                disabled={isLoadingSettings || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-time">Closing Time</Label>
              <Input
                id="close-time"
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                disabled={isLoadingSettings || isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Working Days</Label>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{day}</span>
                <Switch 
                  checked={workingDays.includes(day)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setWorkingDays([...workingDays, day]);
                    } else {
                      setWorkingDays(workingDays.filter(d => d !== day));
                    }
                  }}
                  disabled={isLoadingSettings || isSubmitting}
                />
              </div>
            ))}
          </div>

          <Button 
            className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A]"
            onClick={handleSaveWorkingHours}
            disabled={isLoadingSettings || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Working Hours'}
          </Button>
        </CardContent>
      </Card>

      {/* Appointment Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle>Appointment Settings</CardTitle>
              <CardDescription>Configure booking rules and buffers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buffer Time */}
          <div className="space-y-3">
            <Label htmlFor="buffer-time">Slot Buffer Time (minutes)</Label>
            <p className="text-sm text-gray-500">
              Time gap between appointments to prevent scheduling conflicts
            </p>
            <Select value={bufferTime} onValueChange={setBufferTime}>
              <SelectTrigger id="buffer-time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Buffer</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setConfirmDialog({ open: true, type: 'buffer' })} 
              variant="outline"
              disabled={isSubmitting || isLoadingSettings}
            >
              Update Buffer Time
            </Button>
          </div>

          <Separator />

          {/* Cancellation Window */}
          <div className="space-y-3">
            <Label htmlFor="cancel-window">Cancellation Window (hours)</Label>
            <p className="text-sm text-gray-500">
              Minimum notice required for appointment cancellation
            </p>
            <Select 
              value={cancellationWindow} 
              onValueChange={setCancellationWindow}
              disabled={isLoadingSettings}
            >
              <SelectTrigger id="cancel-window">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setConfirmDialog({ open: true, type: 'cancellation' })} 
              variant="outline"
              disabled={isSubmitting || isLoadingSettings}
            >
              Update Cancellation Window
            </Button>
          </div>

          <Separator />

          {/* OTP Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>OTP Verification Required</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Require OTP verification before booking
                </p>
              </div>
              <Switch 
                checked={otpRequired} 
                onCheckedChange={setOtpRequired}
                disabled={isLoadingSettings}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="otp-expiry">OTP Expiry Time (minutes)</Label>
            <Select 
              value={otpExpiry} 
              onValueChange={setOtpExpiry}
              disabled={isLoadingSettings}
            >
              <SelectTrigger id="otp-expiry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 minutes</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setConfirmDialog({ open: true, type: 'otp' })} 
              variant="outline"
              disabled={isSubmitting || isLoadingSettings}
            >
              Update OTP Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Roles & Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle>User Roles & Permissions</CardTitle>
              <CardDescription>Manage staff access levels</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { role: 'Admin', users: 2, access: 'Full access to all features' },
              { role: 'Manager', users: 3, access: 'Manage appointments, patients, and doctors' },
              { role: 'Receptionist', users: 5, access: 'Create and manage appointments' }
            ].map((role, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{role.role}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{role.access}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{role.users} users</p>
                  <Button variant="ghost" size="sm" className="mt-1">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>Sync appointments with external calendars</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                calendarConnected ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Google Calendar</p>
                <p className="text-xs text-gray-500">
                  {calendarConnected ? 'Connected and syncing' : 'Not connected'}
                </p>
              </div>
            </div>
            {calendarConnected ? (
              <Button 
                variant="outline" 
                onClick={handleDisconnectCalendar}
                className="text-red-600 hover:text-red-700"
                disabled={isSubmitting || isLoadingSettings}
              >
                Disconnect
              </Button>
            ) : (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleSaveCalendarConnection(true)}
                disabled={isSubmitting || isLoadingSettings}
              >
                Connect
              </Button>
            )}
          </div>

          {calendarConnected && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-900">
                ✓ Your appointments are being synced with Google Calendar in real-time
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Version</span>
            <span className="font-medium text-gray-900">1.0.0</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Timezone</span>
            <span className="font-medium text-gray-900">UAE (UTC+4)</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Last Backup</span>
            <span className="font-medium text-gray-900">Today, 3:00 AM</span>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog?.open || false} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === 'buffer' && 
                'Changing buffer time affects future appointments only. Existing appointments will not be modified.'
              }
              {confirmDialog?.type === 'cancellation' && 
                'Changing cancellation window affects future appointments only. Existing appointments will not be modified.'
              }
              {confirmDialog?.type === 'otp' && 
                'Changing OTP settings affects future appointments only. Existing appointments will not be modified.'
              }
              {confirmDialog?.type === 'calendar' && 
                'This will stop syncing new appointments with your calendar. Are you sure?'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onLogout} className="bg-red-600 hover:bg-red-700">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
            <DialogDescription>
              Add a new admin to your clinic.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAdminSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={adminForm.name}
                  onChange={handleAdminFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={adminForm.email}
                  onChange={handleAdminFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={adminForm.phone}
                  onChange={handleAdminFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={adminForm.role}
                  onValueChange={(value) => setAdminForm(prev => ({ ...prev, role: value as AdminRole }))}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment-manager">Appointment Manager</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAdminOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A]" disabled={isSubmitting}>
                Add Admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={editAdminOpen} onOpenChange={setEditAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Edit the details of the selected admin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAdminSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={adminForm.name}
                  onChange={handleAdminFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={adminForm.email}
                  onChange={handleAdminFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={adminForm.phone}
                  onChange={handleAdminFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={adminForm.role}
                  onValueChange={(value) => setAdminForm(prev => ({ ...prev, role: value as AdminRole }))}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment-manager">Appointment Manager</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAdminOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[rgb(203,255,143)] hover:bg-[#AEEF5A]" disabled={isSubmitting}>
                Update Admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <AlertDialog open={deleteAdminOpen} onOpenChange={setDeleteAdminOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this admin? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleDeleteAdminSubmit}>
            <AlertDialogFooter>
              <AlertDialogCancel>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                Delete Admin
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}