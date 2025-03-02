import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, User, Check, Loader2 } from 'lucide-react';
import { getSupabase } from '@/utils/supabase/supabase'; // Use admin client for next_auth schema
import * as FileUpload from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export function ProfileSettings() {
  const { data: session, update: updateSession } = useSession();
  // Use the admin client which has access to next_auth schema
  const supabase = getSupabase();
  
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
        // Use next_auth schema
        const { data, error } = await supabase
          .from('next_auth.users')
          .select('username, avatar_url')
          .eq('id', session.user.id)
          .single();
        
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
  }, [session?.user?.id]); // Only depend on the ID

  // Handle username change
  const handleUsernameChange = async (e) => {
    e.preventDefault();
    
    if (username === originalUsername) {
      return; // No change needed
    }
    
    try {
      setIsUpdatingUsername(true);
      
      // Use next_auth schema
      const { error } = await supabase
        .from('next_auth.users')
        .update({ username })
        .eq('id', session.user.id);
      
      if (error) {
        console.error('Error updating username:', error);
        toast("Failed to update username");
        return;
      }
      
      setOriginalUsername(username);
      toast("Username updated successfully");
      
      // Update the session to reflect changes if needed
      await updateSession();
      
    } catch (error) {
      console.error('Error updating username:', error);
      toast("Failed to update username");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  // Handle file selection for avatar
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
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

  // Upload avatar to Supabase Storage and update profile
  const uploadAvatar = async () => {
    if (!avatarFile || !session?.user?.id) return;
    
    setIsUploading(true);
    try {
      // Using timestamp to create unique filename
      const timestamp = Date.now();
      const fileExt = avatarFile.name.split('.').pop().toLowerCase();
      const fileName = `img${timestamp}.${fileExt}`;
      
      // Upload with minimal options
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
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const newAvatarUrl = urlData.publicUrl;
      
      // Update in next_auth schema
      const { error: updateError } = await supabase
        .from('next_auth.users')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', session.user.id);
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
        toast("Image uploaded but profile update failed");
        // Still update the UI with the new image even if DB update fails
        setAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
        setPreviewUrl('');
        setIsUploading(false);
        return;
      }
      
      // Update local state
      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setPreviewUrl('');
      
      toast("Avatar updated successfully");
      
      // Update the session to reflect changes
      await updateSession();
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast("Failed to upload avatar");
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
          <Avatar className="w-24 h-24 border">
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