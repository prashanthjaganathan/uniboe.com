import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, AlertCircle, Check, X } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Password validation checks
  const passwordValidation = useMemo(() => {
    return {
      minLength: registerPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(registerPassword),
      hasLowercase: /[a-z]/.test(registerPassword),
      hasNumber: /\d/.test(registerPassword),
    };
  }, [registerPassword]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      await login({ email: loginEmail, password: loginPassword });
      navigate('/home');
    } catch (error) {
      // Extract error message from API response
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        'Invalid email or password. Please try again.';
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setRegisterLoading(true);

    try {
      // Validate passwords match
      if (registerPassword !== registerConfirmPassword) {
        setRegisterError('Passwords do not match');
        setRegisterLoading(false);
        return;
      }

      // Extract domain from email
      const emailParts = registerEmail.split('@');
      if (emailParts.length !== 2) {
        setRegisterError('Please enter a valid university email');
        setRegisterLoading(false);
        return;
      }

      const domain = emailParts[1];

      // Combine first and last name
      const fullName = `${registerFirstName.trim()} ${registerLastName.trim()}`;

      // Call register with object parameter matching UserRegistrationRequest
      const response = await register({
        full_name: fullName,
        university_email: registerEmail,
        university_domain: domain,
        password: registerPassword,
      });

      // Check if email confirmation is required
      if (response.email_confirmation_required) {
        setRegisterSuccess(response.message || 'Please check your email to confirm your account.');
      } else {
        // Registration successful with immediate login
        navigate('/home');
      }
    } catch (error) {
      // Extract error message from API response
      const errorMessage =
        error.response?.data?.detail || error.message || 'Registration failed. Please try again.';
      setRegisterError(errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-3xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Uniboe</h1>
          <p className="text-slate-600">Your Student Life Companion</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">University Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@university.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={loginLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loginLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500"
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  {registerError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{registerError}</span>
                    </div>
                  )}

                  {registerSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      <span className="text-sm">{registerSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-first-name">First Name</Label>
                      <Input
                        id="register-first-name"
                        type="text"
                        placeholder="John"
                        value={registerFirstName}
                        onChange={(e) => setRegisterFirstName(e.target.value)}
                        required
                        disabled={registerLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-last-name">Last Name</Label>
                      <Input
                        id="register-last-name"
                        type="text"
                        placeholder="Doe"
                        value={registerLastName}
                        onChange={(e) => setRegisterLastName(e.target.value)}
                        required
                        disabled={registerLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">University Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@university.edu"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      disabled={registerLoading}
                    />
                    <p className="text-xs text-slate-500">Use your official university email</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      disabled={registerLoading}
                      minLength={8}
                    />
                    {registerPassword && (
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2 text-xs">
                          {passwordValidation.minLength ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-red-500" />
                          )}
                          <span
                            className={
                              passwordValidation.minLength ? 'text-green-600' : 'text-slate-500'
                            }
                          >
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordValidation.hasUppercase ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-red-500" />
                          )}
                          <span
                            className={
                              passwordValidation.hasUppercase ? 'text-green-600' : 'text-slate-500'
                            }
                          >
                            Contains uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordValidation.hasLowercase ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-red-500" />
                          )}
                          <span
                            className={
                              passwordValidation.hasLowercase ? 'text-green-600' : 'text-slate-500'
                            }
                          >
                            Contains lowercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordValidation.hasNumber ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-red-500" />
                          )}
                          <span
                            className={
                              passwordValidation.hasNumber ? 'text-green-600' : 'text-slate-500'
                            }
                          >
                            Contains number
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                      disabled={registerLoading}
                      minLength={8}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500"
                    disabled={registerLoading}
                  >
                    {registerLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          By continuing, you agree to Uniboe's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
