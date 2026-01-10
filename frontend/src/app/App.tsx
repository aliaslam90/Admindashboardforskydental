import { useEffect, useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { SyncProvider } from "./contexts/SyncContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { SyncIndicator } from "./components/SyncIndicator";
import { DashboardLayout } from "./components/DashboardLayout";
import { DoctorLayout } from "./components/DoctorLayout";
import { Dashboard } from "./pages/Dashboard";
import { Appointments } from "./pages/Appointments";
import { CalendarView } from "./pages/CalendarView";
import { Patients } from "./pages/Patients";
import { Doctors } from "./pages/Doctors";
import { Services } from "./pages/Services";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { DoctorLogin } from "./pages/DoctorLogin";
import { ForgotPassword } from "./pages/ForgotPassword";
import { DoctorAppointments } from "./pages/doctor/DoctorAppointments";
import { DoctorCalendarView } from "./pages/doctor/DoctorCalendarView";
import { DoctorPatients } from "./pages/doctor/DoctorPatients";
import { DoctorProfile } from "./pages/doctor/DoctorProfile";
import { Admin, AdminRole, Doctor } from "./data/types";
import { toast } from "sonner";
import { doctorsApi } from "./services/doctorsApi";
import { servicesApi, Service } from "./services/servicesApi";
import {
  CreateAppointmentModal,
  CreateAppointmentPrefill,
} from "./components/CreateAppointmentModal";

type Page =
  | "dashboard"
  | "appointments"
  | "calendar"
  | "patients"
  | "doctors"
  | "services"
  | "notifications"
  | "settings";
type DoctorPage =
  | "appointments"
  | "calendar"
  | "patients"
  | "profile";
type AuthPage =
  | "admin-login"
  | "doctor-login"
  | "forgot-password"
  | "admin-dashboard"
  | "doctor-dashboard";

type StoredAuth = {
  authPage: AuthPage;
  currentAdmin: Admin | null;
  currentDoctor: Doctor | null;
  currentPage: Page;
  doctorPage: DoctorPage;
};

const AUTH_STORAGE_KEY = "sky-dental-auth";

const isPage = (value: string): value is Page =>
  [
    "dashboard",
    "appointments",
    "calendar",
    "patients",
    "doctors",
    "services",
    "notifications",
    "settings",
  ].includes(value as Page);

const isDoctorPage = (value: string): value is DoctorPage =>
  ["appointments", "calendar", "patients", "profile"].includes(
    value as DoctorPage,
  );

function AppContent() {
  const [authPage, setAuthPage] =
    useState<AuthPage>("admin-login");
  const [currentAdmin, setCurrentAdmin] =
    useState<Admin | null>(null);
  const [currentDoctor, setCurrentDoctor] =
    useState<Doctor | null>(null);
  const [doctorOptions, setDoctorOptions] = useState<Doctor[]>([]);
  const [serviceOptions, setServiceOptions] = useState<Service[]>([]);
  const [currentPage, setCurrentPage] =
    useState<Page>("dashboard");
  const [doctorPage, setDoctorPage] =
    useState<DoctorPage>("appointments");
  const [pageData, setPageData] = useState<any>(null);
  const [createAppointmentOpen, setCreateAppointmentOpen] =
    useState(false);
  const [createAppointmentInitial, setCreateAppointmentInitial] =
    useState<CreateAppointmentPrefill | null>(null);
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] =
    useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  const handleNavigate = (page: string, data?: any) => {
    const targetPage = isPage(page) ? page : "dashboard";
    setCurrentPage(targetPage);
    setPageData(data || null);
  };

  const handleDoctorNavigate = (page: string) => {
    const targetPage = isDoctorPage(page) ? page : "appointments";
    setDoctorPage(targetPage);
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [doctors, services] = await Promise.all([
          doctorsApi.getAll(),
          servicesApi.getAll(),
        ]);
        setDoctorOptions(doctors);
        setServiceOptions(services);
      } catch (error) {
        console.error("Failed to load doctors/services", error);
        toast.error("Failed to load doctors/services");
      }
    };
    loadOptions();
  }, []);

  // Hydrate auth state from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      setIsHydrated(true);
      return;
    }
    try {
      const data = JSON.parse(raw) as StoredAuth;
      if (data.currentAdmin) setCurrentAdmin(data.currentAdmin);
      if (data.currentDoctor) setCurrentDoctor(data.currentDoctor);
      if (data.authPage) setAuthPage(data.authPage);
      if (data.currentPage) setCurrentPage(data.currentPage);
      if (data.doctorPage) setDoctorPage(data.doctorPage);
    } catch (error) {
      console.error("Failed to hydrate auth state", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist auth state
  useEffect(() => {
    if (!isHydrated) return;
    const payload: StoredAuth = {
      authPage,
      currentAdmin,
      currentDoctor,
      currentPage,
      doctorPage,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  }, [authPage, currentAdmin, currentDoctor, currentPage, doctorPage, isHydrated]);

  const handleCreateAppointment = (prefill?: CreateAppointmentPrefill) => {
    setCreateAppointmentInitial(prefill ?? null);
    setCreateAppointmentOpen(true);
  };

  const handleAdminLogin = (
    email: string,
    _password: string,
  ) => {
    // Find admin by email
    const name = email.split("@")[0] || "Admin";
    
    // Determine role based on email
    let role: AdminRole = "super-admin";
    if (email.includes("manager@")) {
      role = "manager";
    } else if (email.includes("receptionist@")) {
      role = "receptionist";
    } else if (email === "admin@skydentalclinic.com") {
      role = "super-admin";
    }
    
    // Set permissions based on role
    const isSuperAdmin = role === "super-admin";
    
    const admin: Admin = {
      id: "admin-local",
      name,
      email,
      phone: "",
      role,
      status: "active",
      permissions: {
        dashboard: true,
        appointments: true,
        calendar: true,
        patients: true,
        doctors: true,
        services: true,
        notifications: true,
        settings: isSuperAdmin, // Only super-admin can access settings
        adminManagement: isSuperAdmin, // Only super-admin can manage admins
      },
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setCurrentAdmin(admin);
    setAuthPage("admin-dashboard");
    const roleName = role === "super-admin" ? "Super Admin" : role === "manager" ? "Manager" : "Receptionist";
    toast.success(`Welcome back, ${admin.name}!`, {
      description: `Logged in as ${roleName}`,
    });
  };

  const handleDoctorLogin = (
    _email: string,
    _password: string,
  ) => {
    const doctor = doctorOptions[0] || null;
    if (doctor) {
      setCurrentDoctor(doctor);
      setAuthPage("doctor-dashboard");
      toast.success(`Welcome back, ${doctor.name}!`, {
        description: `Logged in as ${doctor.specialization} Doctor`,
      });
    } else {
      toast.error("No doctors available. Please add a doctor first.");
    }
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    setCurrentDoctor(null);
    setAuthPage("admin-login");
    setCurrentPage("dashboard");
    setDoctorPage("appointments");
    localStorage.removeItem(AUTH_STORAGE_KEY);
    toast.success("Logged out successfully");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onCreateAppointment={handleCreateAppointment}
            currentAdmin={currentAdmin}
          />
        );
      case "appointments":
        return (
          <Appointments
            onCreateAppointment={handleCreateAppointment}
            selectedAppointmentId={pageData?.selectedId}
            refreshKey={appointmentsRefreshKey}
            currentAdmin={currentAdmin}
          />
        );
      case "calendar":
        return (
          <CalendarView
            onCreateAppointment={handleCreateAppointment}
            currentAdmin={currentAdmin}
          />
        );
      case "patients":
        return <Patients />;
      case "doctors":
        return <Doctors currentAdmin={currentAdmin} />;
      case "services":
        return <Services currentAdmin={currentAdmin} />;
      case "notifications":
        return <Notifications />;
      case "settings":
        return (
          <Settings
            currentAdmin={currentAdmin!}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onCreateAppointment={handleCreateAppointment}
          />
        );
    }
  };

  const renderDoctorPage = () => {
    switch (doctorPage) {
      case "appointments":
        return (
          <DoctorAppointments currentDoctor={currentDoctor!} />
        );
      case "calendar":
        return (
          <DoctorCalendarView currentDoctor={currentDoctor!} />
        );
      case "patients":
        return (
          <DoctorPatients currentDoctor={currentDoctor!} />
        );
      case "profile":
        return <DoctorProfile currentDoctor={currentDoctor!} />;
      default:
        return (
          <DoctorAppointments currentDoctor={currentDoctor!} />
        );
    }
  };

  return (
    <>
      {/* Avoid flicker while hydrating auth state */}
      {!isHydrated && null}
      {authPage === "admin-login" && (
        <Login
          onLogin={handleAdminLogin}
          onForgotPassword={() =>
            setAuthPage("forgot-password")
          }
          onSwitchToDoctor={() => setAuthPage("doctor-login")}
        />
      )}
      {authPage === "doctor-login" && (
        <DoctorLogin
          onLogin={handleDoctorLogin}
          onForgotPassword={() =>
            setAuthPage("forgot-password")
          }
          onSwitchToAdmin={() => setAuthPage("admin-login")}
        />
      )}
      {authPage === "forgot-password" && (
        <ForgotPassword
          onBackToLogin={() => setAuthPage("admin-login")}
        />
      )}

      {authPage === "admin-dashboard" && (
        <DashboardLayout
          currentPage={currentPage}
          onNavigate={handleNavigate}
          currentAdmin={currentAdmin!}
          onLogout={handleLogout}
        >
          {renderPage()}
        </DashboardLayout>
      )}

      {authPage === "doctor-dashboard" && (
        <DoctorLayout
          currentPage={doctorPage}
          onNavigate={handleDoctorNavigate}
          currentDoctor={currentDoctor!}
          onLogout={handleLogout}
        >
          {renderDoctorPage()}
        </DoctorLayout>
      )}

      {authPage === "admin-dashboard" && (
        <CreateAppointmentModal
          open={createAppointmentOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCreateAppointmentInitial(null);
            }
            setCreateAppointmentOpen(open);
          }}
          initialValues={createAppointmentInitial ?? undefined}
          doctorOptions={doctorOptions}
          serviceOptions={serviceOptions}
          onCreated={() => {
            setCurrentPage("appointments");
            setAppointmentsRefreshKey((v) => v + 1);
          }}
        />
      )}

      <SyncIndicator />
      <Toaster position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <SyncProvider>
      <NotificationsProvider>
        <AppContent />
      </NotificationsProvider>
    </SyncProvider>
  );
}