// src/pages/LoginPage.jsx
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from 'react-hot-toast';
import { auth } from '@/services/auth';
import { useDispatch } from '@/store/store';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSuccess = async (credentialResponse) => {
    try {
      // Use auth service to handle login
      const user = await auth.handleGoogleLogin(credentialResponse.credential);
      
      // Update global state
      dispatch({ type: 'SET_USER', payload: user });
      
      toast.success('Login successful!');
      navigate('/chat');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  const handleError = () => {
    console.error('Login Failed');
    toast.error('Login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to Travel Planner</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;