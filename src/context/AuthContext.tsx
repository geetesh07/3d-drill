import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { User, AdminUserAttributes } from '@supabase/supabase-js';

interface UserMetadata {
  full_name: string;
  username: string;
  phone_number: string;
  role: string;
  is_approved?: boolean;
}

interface UserData extends UserMetadata {
  id: string;
  email: string;
  created_at: string;
}

interface DatabaseUser {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone_number: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, metadata: UserMetadata) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (metadata: Partial<UserMetadata>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  setAdminRole: () => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  unapproveUser: (userId: string) => Promise<void>;
  isUserApproved: (userId: string) => Promise<boolean>;
  getAllUsers: () => Promise<UserData[]>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting email login...');
      
      // First attempt to sign in to get the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error('Login error:', signInError);
        throw signInError;
      }

      if (!signInData.user) {
        console.error('No user data returned from login');
        throw new Error('No user data returned from login');
      }

      // Check if the user is approved
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('is_approved')
        .eq('id', signInData.user.id)
        .single();
        
      console.log('User approval status:', { userData, error: userError });

      if (userError) {
        console.error('Error checking approval status:', userError);
        throw userError;
      }

      // Check if user is not approved (either false, null, or undefined)
      if (!userData || userData.is_approved !== true) {
        console.log('User found but not approved');
        // Sign out the user since they're not approved
        await supabase.auth.signOut();
        throw new Error('Your account is pending approval. Please contact an administrator.');
      }

      console.log('User logged in successfully:', signInData.user.id);
    } catch (error) {
      console.error('Error in login process:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, metadata: UserMetadata) => {
    try {
      // First check if user exists
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('A user with this email already exists');
      }

      // Use regular Supabase auth signup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.full_name,
            username: metadata.username,
            phone_number: metadata.phone_number
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data?.user?.id) {
        throw new Error('Failed to create user account');
      }

      // Let the database trigger handle user creation in the users table
      console.log('Signup successful. Please check your email for confirmation.');
    } catch (error: any) {
      console.error('Signup error:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const updateProfile = async (metadata: Partial<UserMetadata>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            role: role
          }
        }
      );

      if (error) throw error;

      console.log('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  const setAdminRole = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('User not found');

      // Update user metadata with admin role
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          role: 'admin'
        }
      });

      if (updateError) throw updateError;

      console.log('User role set to admin successfully');
      // Refresh the session to get updated metadata
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      if (session) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error setting admin role:', error);
      throw error;
    }
  };

  const approveUser = async (userId: string) => {
    try {
      // Update the user's metadata in auth using supabaseAdmin
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            is_approved: true
          }
        }
      );

      if (authError) {
        console.error('Auth error approving user:', authError);
        throw new Error(`Auth error: ${authError.message}`);
      }

      // Update the user's record in the database using supabaseAdmin
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({ is_approved: true })
        .eq('id', userId);

      if (dbError) {
        console.error('Database error approving user:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  };

  const unapproveUser = async (userId: string) => {
    try {
      // Update the user's metadata in auth using supabaseAdmin
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            is_approved: false
          }
        }
      );

      if (authError) {
        console.error('Auth error unapproving user:', authError);
        throw new Error(`Auth error: ${authError.message}`);
      }

      // Update the user's record in the database using supabaseAdmin
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({ is_approved: false })
        .eq('id', userId);

      if (dbError) {
        console.error('Database error unapproving user:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('User unapproved successfully');
    } catch (error) {
      console.error('Error unapproving user:', error);
      throw error;
    }
  };

  const isUserApproved = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_approved')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return data?.is_approved === true;
    } catch (error) {
      console.error('Error checking user approval status:', error);
      return false;
    }
  };

  const getAllUsers = async (): Promise<UserData[]> => {
    try {
      // First get all auth users
      const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        throw authError;
      }

      // Then get all database users
      const { data: dbUsers, error: dbError } = await supabaseAdmin
        .from('users')
        .select('*');

      if (dbError) {
        console.error('Error fetching database users:', dbError);
        throw dbError;
      }

      // Combine the data from both sources
      const combinedUsers = (dbUsers as DatabaseUser[]).map(dbUser => {
        const authUser = (authUsers as any[]).find(au => au.id === dbUser.id);
        return {
          id: dbUser.id,
          email: dbUser.email,
          full_name: dbUser.full_name,
          username: dbUser.username,
          phone_number: dbUser.phone_number,
          role: dbUser.role,
          is_approved: authUser?.user_metadata?.is_approved || dbUser.is_approved || false,
          created_at: dbUser.created_at
        };
      });

      console.log('Fetched users:', combinedUsers); // Debug log
      return combinedUsers;
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      user, 
      login, 
      signup, 
      logout,
      updateProfile,
      updatePassword,
      updateUserRole,
      setAdminRole,
      approveUser,
      unapproveUser,
      isUserApproved,
      getAllUsers,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

