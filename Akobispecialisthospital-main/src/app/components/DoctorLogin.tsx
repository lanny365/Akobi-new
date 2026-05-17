import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Stethoscope, LogIn, Lock, Mail } from 'lucide-react';
import { useDoctorAuth } from '../context/DoctorAuthContext';
import { toast } from 'sonner';
import { navigateTo } from '../utils/navigation';

export function DoctorLogin() {
  const { login } = useDoctorAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password);

      if (success) {
        toast.success('Login successful!');
        navigateTo('/doctor-login');
      } else {
        toast.error('Invalid email or password');
      }

      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Doctor Portal</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              AKOBI SPECIALIST HOSPITAL
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sign in to access patient consultations
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@akobi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-blue-900 font-semibold mb-2">Demo Credentials:</p>
              <p className="text-xs text-blue-800">Email: sarah.johnson@akobi.com</p>
              <p className="text-xs text-blue-800">Password: doctor123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
