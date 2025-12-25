import { ReactNode, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCog, 
  Briefcase, 
  Bell, 
  Settings, 
  Menu, 
  X,
  LogOut,
  ChevronDown,
  Stethoscope
} from 'lucide-react';
import { cn } from './ui/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { NotificationCenter } from './NotificationCenter';
import { Admin } from '../data/mockData';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  currentAdmin?: Admin;
  onLogout: () => void;
}

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { name: 'Appointments', icon: Calendar, id: 'appointments' },
  { name: 'Calendar', icon: Calendar, id: 'calendar' },
  { name: 'Patients', icon: Users, id: 'patients' },
  { name: 'Doctors', icon: Stethoscope, id: 'doctors' },
  { name: 'Services', icon: Briefcase, id: 'services' },
  { name: 'Notifications', icon: Bell, id: 'notifications' },
  { name: 'Settings', icon: Settings, id: 'settings' },
];

export function DashboardLayout({ children, currentPage, onNavigate, currentAdmin, onLogout }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Sky Dental</h1>
                <p className="text-xs text-gray-500">Abu Dhabi</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "text-blue-700" : "text-gray-500")} />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="h-8 w-px bg-gray-200 hidden sm:block" />
              <NotificationCenter userId="admin" userType="admin" />
              
              {/* User Dropdown */}
              {currentAdmin && (
                <>
                  <div className="h-8 w-px bg-gray-200" />
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {currentAdmin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left hidden md:block">
                        <p className="text-sm font-medium text-gray-900">{currentAdmin.name}</p>
                        <p className="text-xs text-gray-500">
                          {currentAdmin.role === 'super-admin' ? 'Super Admin' : 'Appointment Manager'}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{currentAdmin.name}</p>
                          <p className="text-xs text-gray-500">{currentAdmin.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onNavigate('settings')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={onLogout}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}