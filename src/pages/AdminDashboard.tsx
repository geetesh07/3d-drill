import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle, XCircle, Trash2, UserPlus, UserMinus, Users } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWithMetadata {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    full_name?: string;
    username?: string;
    phone_number?: string;
    role?: string;
    is_approved?: boolean;
  };
  is_approved?: boolean;
}

interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  username?: string;
  phone_number?: string;
  role?: string;
  is_approved?: boolean;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { updateUserRole, approveUser, unapproveUser, getAllUsers } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc'
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  // Function to add a test user
  const addTestUser = async () => {
    try {
      // Generate a random ID
      const randomId = Math.random().toString(36).substring(2, 15);
      
      // Create a test user
      const testUser = {
        id: randomId,
        email: `test${randomId}@example.com`,
        full_name: `Test User ${randomId}`,
        username: `testuser${randomId}`,
        phone_number: '1234567890',
        role: 'user',
        is_approved: false,
        created_at: new Date().toISOString()
      };
      
      // Insert the test user into the database
      const { error } = await supabaseAdmin
        .from('users')
        .insert(testUser);
        
      if (error) {
        console.error('Error adding test user:', error);
        toast.error('Failed to add test user');
      } else {
        toast.success('Test user added successfully');
        loadUsers(); // Reload users
      }
    } catch (err) {
      console.error('Error adding test user:', err);
      toast.error('Failed to add test user');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user to check if they're an admin
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (!currentUser) {
        throw new Error('No user found');
      }
      
      // Check if current user is an admin
      if (currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // Try a different approach to fetch users
      // First, get all auth users
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        throw authError;
      }
      
      const authUsers = authData.users;
      console.log('Auth users count:', authUsers.length);
      
      // Convert auth users to the format we need
      const formattedUsers = authUsers.map(authUser => ({
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        is_approved: authUser.user_metadata?.is_approved || false,
        user_metadata: {
          full_name: authUser.user_metadata?.full_name || '',
          username: authUser.user_metadata?.username || '',
          phone_number: authUser.user_metadata?.phone_number || '',
          role: authUser.user_metadata?.role || 'user',
          is_approved: authUser.user_metadata?.is_approved || false
        }
      }));
      
      console.log('Formatted users count:', formattedUsers.length);
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      // Also update the user's metadata in auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            role: newRole
          }
        }
      );

      if (authError) throw authError;
      
      toast.success('User role updated successfully');
      loadUsers(); // Refresh the user list
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const newApprovalStatus = !currentStatus;
      
      // Update the user's metadata in auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            is_approved: newApprovalStatus
          }
        }
      );

      if (authError) {
        console.error('Error updating auth user:', authError);
        throw authError;
      }
      
      toast.success(`User ${newApprovalStatus ? 'approved' : 'unapproved'} successfully`);
      await loadUsers(); // Reload the users list
    } catch (err) {
      console.error('Error updating user status:', err);
      toast.error('Failed to update user status. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      // First delete from the users table
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) throw dbError;

      // Then delete the user from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      toast.success("Success", {
        description: "User deleted successfully.",
      });
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("Error", {
        description: "Failed to delete user. Please try again.",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchLower) ||
      user.user_metadata?.full_name?.toLowerCase().includes(searchLower) ||
      user.user_metadata?.username?.toLowerCase().includes(searchLower);
    
    const matchesCompany = 
      companyFilter === 'all' || user.user_metadata?.role === companyFilter;
    
    const matchesApproval = 
      approvalFilter === 'all' ||
      (approvalFilter === 'approved' && user.is_approved) ||
      (approvalFilter === 'unapproved' && !user.is_approved);

    return matchesSearch && matchesCompany && matchesApproval;
  });

  const uniqueCompanies = Array.from(new Set(users.map(user => user.user_metadata?.role)));

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key === 'created_at') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleBulkApprove = async () => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      // Update each selected user
      for (const userId of selectedUsers) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              is_approved: true
            }
          }
        );
        
        if (error) {
          console.error(`Error approving user ${userId}:`, error);
        }
      }
      
      toast.success('Selected users approved successfully');
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error approving users:', error);
      toast.error('Failed to approve selected users');
    }
  };

  const handleBulkUnapprove = async () => {
    try {
      // Verify admin status again before making changes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      // Update each selected user
      for (const userId of selectedUsers) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              is_approved: false
            }
          }
        );
        
        if (error) {
          console.error(`Error unapproving user ${userId}:`, error);
        }
      }
      
      toast.success('Selected users unapproved successfully');
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error unapproving users:', error);
      toast.error('Failed to unapprove selected users');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={loadUsers}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, permissions, and access control
          </CardDescription>
          <div className="mt-4">
            <Button onClick={addTestUser} variant="outline">
              Add Test User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by email, name, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Label htmlFor="company">Company</Label>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {uniqueCompanies.map(company => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label htmlFor="approval">Approval Status</Label>
                <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="unapproved">Unapproved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedUsers.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={handleBulkApprove}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Approve Selected
                </Button>
                <Button onClick={handleBulkUnapprove} variant="destructive">
                  <UserMinus className="mr-2 h-4 w-4" />
                  Unapprove Selected
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    Joined {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.user_metadata?.full_name || 'N/A'}</span>
                        <span className="text-sm text-muted-foreground">{user.user_metadata?.username || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.user_metadata?.role || 'N/A'}</TableCell>
                    <TableCell>
                      <select
                        value={user.user_metadata?.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="p-1 border rounded"
                        disabled={user.user_metadata?.role === 'admin'}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.is_approved ? "default" : "destructive"}
                        className={user.is_approved ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {user.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">{getTimeAgo(user.created_at)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(user.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!user.is_approved ? (
                          <Button
                            size="sm"
                            onClick={() => handleApproval(user.id, user.is_approved)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproval(user.id, user.is_approved)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Unapprove
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setUserToDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 