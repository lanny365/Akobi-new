import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserPlus, LogIn, Lock, User } from 'lucide-react';
import { useTheatreAuth } from '../context/TheatreAuthContext';
import { toast } from 'sonner';
import { navigateTo } from '../utils/navigation';

export function SurgeonLogin() {
  const { login } = useTheatreAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const success = login(username, password, 'surgeon');
      if (success) {
        toast.success('Welcome back, Surgeon!');
        navigateTo('/theatre?tab=surgeon');
      } else {
        toast.error('Invalid credentials. Please check your username and password.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl">Surgeon Portal</CardTitle>
            <p className="text-gray-600 mt-2">AISHMS - Theatre Management System</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-2"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 h-12 text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Sign In as Surgeon
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Username: <span className="font-mono bg-white px-2 py-0.5 rounded">surgeon1</span></p>
              <p>• Password: <span className="font-mono bg-white px-2 py-0.5 rounded">surgeon123</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
