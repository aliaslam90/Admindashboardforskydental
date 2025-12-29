import image_6ed9d1dbe20e8b3479eed332bf1c51ffbc9e9f7c from 'figma:asset/6ed9d1dbe20e8b3479eed332bf1c51ffbc9e9f7c.png';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle } from 'lucide-react';
import logoImage from 'figma:asset/80004d1fc9e19baea80acbe314a05dbf7a3f4d62.png';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onForgotPassword: () => void;
  onSwitchToDoctor?: () => void;
}

export function Login({ onLogin, onForgotPassword, onSwitchToDoctor }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Demo credentials
      if (email === 'admin@skydentalclinic.com' && password === 'admin123') {
        onLogin(email, password);
      } else if (email === 'manager@skydentalclinic.com' && password === 'manager123') {
        onLogin(email, password);
      } else {
        setError('Invalid email or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 bg-[rgba(203,255,143,0.3)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <img src={image_6ed9d1dbe20e8b3479eed332bf1c51ffbc9e9f7c} alt="Sky Dental Center" className="mx-auto w-48 h-auto" />
          <div>
            <CardDescription className="mt-2">
              Admin Dashboard Login
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
                placeholder="admin@skydentalclinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-[rgb(0,0,0)] hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </button>
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

          <div className="mt-6 pt-6 border-t border-gray-200">
            {onSwitchToDoctor && (
              <button
                onClick={onSwitchToDoctor}
                className="text-sm text-[rgb(0,0,0)] hover:text-blue-700 hover:underline w-full text-center mb-4"
              >
                Are you a doctor? Login here
              </button>
            )}
            
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-[rgb(0,0,0)]">Demo Credentials:</p>
              <div className="text-xs text-blue-800 space-y-1">
                <p className="text-[rgb(0,0,0)]">📧 <strong>Super Admin:</strong> admin@skydentalclinic.com / admin123</p>
                <p className="text-[rgb(0,0,0)]">📧 <strong>Manager:</strong> manager@skydentalclinic.com / manager123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}