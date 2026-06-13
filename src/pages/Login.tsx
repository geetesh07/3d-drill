import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import Logo from '../components/Logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMAIL_DOMAINS = [
  { value: '@gmail.com', label: 'Gmail' },
  { value: '@yahoo.com', label: 'Yahoo' },
  { value: '@hotmail.com', label: 'Hotmail' },
  { value: '@outlook.com', label: 'Outlook' },
  { value: '@custom', label: 'Custom Email' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    domain: '@gmail.com',
  });
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getFullEmail = () => {
    if (formData.domain === '@custom') {
      return customEmail;
    }
    return formData.email + formData.domain;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const email = getFullEmail();
      await login(email, formData.password);
      toast.success("Success", {
        description: "You have been successfully logged in.",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Error logging in:', error);
      if (error.message?.includes('Email not confirmed')) {
        toast.error("Email Not Confirmed", {
          description: "Please check your email and click the confirmation link before signing in.",
        });
      } else if (error.message?.includes('pending approval') || error.message?.includes('Please contact an administrator')) {
        toast.error("Account Pending Approval", {
          description: "Your account is pending administrator approval. Please wait for the approval email before attempting to log in.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "Invalid credentials. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDomainChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      domain: value
    }));
  };

  return (
    <MainLayout>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <div className="mr-6 flex items-center space-x-2">
              <Logo size="sm" linkTo="/" />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Link to="/">
              <Button variant="ghost">Return to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md px-4">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your email to sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  name="email"
                  placeholder="name"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formData.domain === '@custom' ? 'hidden' : ''}
                />
                <Select
                  value={formData.domain}
                  onValueChange={handleDomainChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_DOMAINS.map((domain) => (
                      <SelectItem key={domain.value} value={domain.value}>
                        {domain.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.domain === '@custom' && (
                <Input
                  id="custom-email"
                  placeholder="Enter your email"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  autoCorrect="off"
                  disabled={isLoading}
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
