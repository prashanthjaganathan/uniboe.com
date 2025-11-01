import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import { CheckCircle, XCircle } from 'lucide-react';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
      } catch (err: unknown) {
        setStatus('error');
        const errorMessage = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Email verification failed'
          : 'Email verification failed';
        setMessage(errorMessage);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="py-8">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Verifying your email...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-2">{message}</p>
                <p className="text-gray-600 mb-6">
                  Your email has been verified. You can now log in to your account.
                </p>
                <Link to="/login">
                  <Button variant="gradient">Go to Login</Button>
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="py-8">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-2">Verification Failed</p>
                <p className="text-gray-600 mb-6">{message}</p>
                <Link to="/register">
                  <Button variant="outline">Back to Register</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;

