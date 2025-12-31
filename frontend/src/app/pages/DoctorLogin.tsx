import { useState, FormEvent } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Stethoscope } from 'lucide-react';

interface DoctorLoginProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToAdmin: () => void;
  onForgotPassword: () => void;
}

export function DoctorLogin({ onLogin, onSwitchToAdmin, onForgotPassword }: DoctorLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Demo doctor credentials
      if (email === 'amira.k@email.com' && password === 'doctor123') {
        onLogin(email, password);
      } else if (email === 'hassan.a@email.com' && password === 'doctor123') {
        onLogin(email, password);
      } else if (email === 'layla.m@email.com' && password === 'doctor123') {
        onLogin(email, password);
      } else {
        setError('Invalid email or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Doctor Portal</CardTitle>
            <CardDescription className="mt-2">
              Sky Dental Clinic - Abu Dhabi
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[rgb(203,255,143)] hover:bg-[#AEEF5A]"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <button
              onClick={onSwitchToAdmin}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline w-full text-center"
            >
              Switch to Admin Login
            </button>

            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-blue-900">Demo Doctor Credentials:</p>
              <div className="text-xs text-blue-800 space-y-1">
                <p>📧 amira.k@email.com / doctor123</p>
                <p>📧 hassan.a@email.com / doctor123</p>
                <p>📧 layla.m@email.com / doctor123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}