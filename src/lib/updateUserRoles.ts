import { supabase } from './supabase';

export async function updateExistingUsersRoles() {
  try {
    // First, ensure the enum type exists
    const { error: enumError } = await supabase.rpc('create_user_role_enum');
    if (enumError) {
      console.error('Error creating enum:', enumError);
      throw enumError;
    }

    // Get all users ordered by creation date
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      console.log('No users found to update');
      return;
    }

    // Update each user's role
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const role = i === 0 ? 'admin' : 'user';

      // Update the role in the users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: role })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Error updating user ${user.email}:`, updateError);
      } else {
        console.log(`Successfully updated role for user ${user.email} to ${role}`);
      }

      // Update the user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          role: role
        }
      });

      if (metadataError) {
        console.error(`Error updating metadata for user ${user.email}:`, metadataError);
      }
    }

    console.log('Finished updating user roles');
  } catch (error) {
    console.error('Error updating user roles:', error);
    throw error;
  }
} 