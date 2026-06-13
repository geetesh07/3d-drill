import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SetAdmin() {
  const { setAdminRole, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const setAdmin = async () => {
      try {
        if (user?.email === 'geeteshpatil000@gmail.com') {
          await setAdminRole();
          toast.success('Admin role set successfully');
          navigate('/admin');
        } else {
          toast.error('Not authorized');
          navigate('/');
        }
      } catch (error) {
        console.error('Error setting admin role:', error);
        toast.error('Failed to set admin role');
        navigate('/');
      }
    };

    setAdmin();
  }, [user, setAdminRole, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
} 