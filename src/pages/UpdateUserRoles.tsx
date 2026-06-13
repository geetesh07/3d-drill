import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { updateExistingUsersRoles } from '../lib/updateUserRoles';

export default function UpdateUserRoles() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdateRoles = async () => {
    try {
      setIsUpdating(true);
      await updateExistingUsersRoles();
      toast({
        title: "Success",
        description: "User roles have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: "Error",
        description: "Failed to update user roles.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update User Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This will update all existing users with appropriate roles:
              <ul className="list-disc pl-6 mt-2">
                <li>The first user to sign up will be set as admin</li>
                <li>All other users will be set as regular users</li>
              </ul>
            </p>
            <Button 
              onClick={handleUpdateRoles} 
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update User Roles'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 