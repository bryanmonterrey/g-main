import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, User, Check, Loader2 } from 'lucide-react';
import { getSupabase } from '@/utils/supabase/getDataWhenAuth';
import * as FileUpload from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export function ProfileSettings() {
  const { data: session, update: updateSession } = useSession();
  const supabase = getSupabase(session);
  
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Load user data on component mount
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchUserData = async () => {
      try {
        // Try to get data from public schema first (our source of truth)
        const { data, error } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        console.log('Fetched user data:', { data, error });
        
        if (error) {
          console.error('Error fetching user data:', error);
          // Use session data as fallback
          setUsername(session.user.name || '');
          setOriginalUsername(session.user.name || '');
          setAvatarUrl(session.user.image || '');
          return;
        }
        
        if (data) {
          setUsername(data.username || '');
          setOriginalUsername(data.username || '');
          setAvatarUrl(data.avatar_url || '');
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      }
    };
    
    fetchUserData();
  }, [session?.user?.id]);

  // Handle username change
  const handleUsernameChange = async (e) => {
    e.preventDefault();
    
    if (username === originalUsername) {
      return; // No change needed
    }
    
    try {
      setIsUpdatingUsername(true);
      
      // Update in both schemas
      let publicUpdated = false;
      let nextAuthUpdated = false;
      
      // Update in public schema
      const { error: publicError } = await supabase
        .from('users')
        .update({ username })
        .eq('id', session.user.id);
      
      if (publicError) {
        console.error('Error updating username in public schema:', publicError);
      } else {
        publicUpdated = true;
      }
      
      // Also update in next_auth schema using RPC function
      const { error: rpcError } = await supabase.rpc('sync_username_to_next_auth', { 
        user_id: session.user.id,
        new_username: username
      });
      
      if (rpcError) {
        console.error('Error updating username in next_auth schema via RPC:', rpcError);
      } else {
        nextAuthUpdated = true;
      }
      
      if (!publicUpdated && !nextAuthUpdated) {
        toast("Failed to update username in any schema");
        return;
      }
      
      setOriginalUsername(username);
      
      if (publicUpdated && nextAuthUpdated) {
        toast("Username updated successfully in both schemas");
      } else if (publicUpdated) {
        toast("Username updated in public schema only");
      } else {
        toast("Username updated in next_auth schema only");
      }
      
      // Update the session to reflect changes
      await updateSession();
      
    } catch (error) {
      console.error('Error updating username:', error);
      toast("Failed to update username: " + error.message);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  // Handle file selection for avatar
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Log file details
    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: Math.round(file.size / 1024) + 'KB'
    });
    
    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!acceptedTypes.includes(file.type)) {
      toast("Please upload a JPEG, PNG, or GIF image");
      return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast("Maximum file size is 2MB");
      return;
    }
    
    setAvatarFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload avatar to Supabase Storage
  const uploadAvatar = async () => {
    if (!avatarFile || !session?.user?.id) return;
    
    setIsUploading(true);
    
    try {
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileExt = avatarFile.name.split('.').pop().toLowerCase();
      const fileName = `${timestamp}.${fileExt}`;
      
      console.log('Starting upload with filename:', fileName);
      
      // Step 1: Upload file to storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          upsert: true
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast("Failed to upload avatar");
        setIsUploading(false);
        return;
      }
      
      console.log('File uploaded successfully:', data);
      
      // Step 2: Get public URL 
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const newAvatarUrl = urlData.publicUrl;
      console.log('Generated URL:', newAvatarUrl);
      
      // Step 3: Update both schemas
      let publicUpdated = false;
      let nextAuthUpdated = false;
      
      // Update in public schema
      const { error: publicError } = await supabase
        .from('users')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', session.user.id);
      
      if (publicError) {
        console.error('Error updating avatar in public schema:', publicError);
      } else {
        publicUpdated = true;
      }
      
      // Also update in next_auth schema using RPC function
      const { error: rpcError } = await supabase.rpc('sync_avatar_to_next_auth', { 
        user_id: session.user.id,
        new_avatar_url: newAvatarUrl
      });
      
      if (rpcError) {
        console.error('Error updating avatar in next_auth schema via RPC:', rpcError);
      } else {
        nextAuthUpdated = true;
      }
      
      // Update UI regardless of database updates
      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setPreviewUrl('');
      
      if (publicUpdated && nextAuthUpdated) {
        toast("Avatar updated successfully in both schemas");
      } else if (publicUpdated) {
        toast("Avatar updated in public schema only");
      } else if (nextAuthUpdated) {
        toast("Avatar updated in next_auth schema only");
      } else {
        toast("Image uploaded but profile update failed");
      }
      
      // Update the session to reflect changes
      await updateSession();
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast("Failed to upload avatar: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      
      {/* Avatar Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Profile Picture</h2>
        
        <div className="flex items-start gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={previewUrl || avatarUrl} />
            <AvatarFallback>
              <User className="w-12 h-12 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <FileUpload.Root className="p-4 border rounded-md">
              <input 
                type="file" 
                tabIndex={-1} 
                className="hidden" 
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
              />
              <FileUpload.Icon as={Upload} />

              <div className="space-y-1.5">
                <div className="text-label-sm text-text-strong-950">
                  Choose a file or drag & drop it here.
                </div>
                <div className="text-paragraph-xs text-text-sub-600">
                  JPEG, PNG, or GIF formats, up to 2 MB.
                </div>
              </div>
              <FileUpload.Button>Browse File</FileUpload.Button>
            </FileUpload.Root>
            
            {avatarFile && (
              <div className="mt-4">
                <Button 
                  onClick={uploadAvatar} 
                  disabled={isUploading} 
                  className="w-full flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Avatar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Username Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Username</h2>
        
        <form onSubmit={handleUsernameChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isUpdatingUsername || username === originalUsername}
            className="flex items-center"
          >
            {isUpdatingUsername ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Username"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}