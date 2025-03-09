"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { Camera } from 'lucide-react';

import { Upload, Check, ArrowRight } from "lucide-react";

// Step 1: Username, Step 2: Profile Picture
type ProfileSetupStep = 1 | 2;

export const ProfileSetupDialog = () => {
  const { data: session, update, status } = useSession();
  
  // Create Supabase client only once (wrapped in useCallback to avoid recreating)
  const getClient = useCallback(() => {
    if (!session) return null;
    return getSupabase(session);
  }, [session]);
  
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProfileSetupStep>(1);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  
  // Use a ref to maintain the current step
  const currentStepRef = useRef<ProfileSetupStep>(1);
  
  // Update ref when step changes
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Check profile setup once when component mounts
  useEffect(() => {
    const checkProfileSetup = async () => {
      if (status !== "authenticated" || !session?.user?.id) return;
      
      const supabase = getClient();
      if (!supabase) return;
      
      try {
        // Fetch user data
        const { data: userData, error } = await supabase
          .from('users')
          .select('username, avatar_url, setup_completed')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user data:", error);
          return;
        }
        
        // Set states based on user data
        setSetupCompleted(!!userData?.setup_completed);
        
        if (userData?.username) {
          setUsername(userData.username);
        } else if (session.user.name && session.user.name !== session.user.id) {
          setUsername(session.user.name);
        }
        
        if (userData?.avatar_url) {
          setAvatarUrl(userData.avatar_url);
        } else if (session.user.image) {
          setAvatarUrl(session.user.image);
        }
        
        // If setup is already done, don't show dialog
        if (userData?.setup_completed) return;
        
        // Determine which step to show
        const hasRealUsername = !!userData?.username || (!!session.user.name && session.user.name !== session.user.id);
        const hasAvatar = !!userData?.avatar_url || !!session.user.image;
        
        if (!hasRealUsername || !hasAvatar) {
          // Set the appropriate step
          const initialStep = !hasRealUsername ? 1 : 2;
          setCurrentStep(initialStep);
          currentStepRef.current = initialStep;
          
          // Open dialog
          setOpen(true);
        } else {
          // Profile complete, mark as setup completed
          await supabase
            .from('users')
            .update({ setup_completed: true })
            .eq('id', session.user.id);
        }
      } catch (err) {
        console.error("Error in profile setup:", err);
      }
    };
    
    if (status === "authenticated") {
      checkProfileSetup();
    }
  }, [session, status, getClient]);
  
  // Handle dialog close
  const handleDialogClose = async (isOpen: boolean) => {
    // Only allow closing the dialog if profile setup is complete or user explicitly skips
    if (!isOpen && !setupCompleted) {
      toast.error("Please complete setup or click Skip");
      return;
    }
    
    setOpen(isOpen);
    
    // If dialog is being closed and session exists
    if (!isOpen && session?.user?.id) {
      const supabase = getClient();
      if (!supabase) return;
      
      try {
        // Mark setup as completed in database
        await supabase
          .from('users')
          .update({ setup_completed: true })
          .eq('id', session.user.id);
          
        setSetupCompleted(true);
      } catch (error) {
        console.error("Error updating setup status:", error);
      }
    }
  };
  
  // Handle continue to avatar step
  const handleContinueToAvatar = () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    
    // Update both state and ref to ensure consistency
    setCurrentStep(2);
    currentStepRef.current = 2;
  };
  
  // Handle file selection for avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      toast.error("Please upload a JPEG, PNG, or GIF image");
      return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maximum file size is 2MB");
      return;
    }
    
    setAvatarFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const uploadAvatar = async () => {
    if (!avatarFile || !session?.user?.id) return;
    
    setIsUploading(true);
    
    try {
      const supabase = getClient();
      if (!supabase) {
        toast.error("Could not connect to storage service");
        return;
      }
      
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileExt = avatarFile.name.split('.').pop()?.toLowerCase();
      const fileName = `avatar_${timestamp}.${fileExt}`;
      
      console.log('Starting upload with filename:', fileName);
      
      // Step 1: Upload file to storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          upsert: true
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Failed to upload avatar: " + uploadError.message);
        return;
      }
      
      console.log('File uploaded successfully:', data);
      
      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const newAvatarUrl = urlData.publicUrl;
      console.log('Generated URL:', newAvatarUrl);
      
      // Update the avatar URL state to show the new image
      setAvatarUrl(newAvatarUrl);
      console.log("Set avatarUrl state to:", newAvatarUrl);
      
      toast.success("Avatar uploaded! Click Save Profile to complete setup.");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
      setAvatarFile(null);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    
    const supabase = getClient();
    if (!supabase) return;
    
    setIsLoading(true);
    
    try {
      let finalAvatarUrl = avatarUrl;
      
      // If there's a file selected but not uploaded yet, upload it now
      if (avatarFile) {
        // Create a unique filename with timestamp
        const timestamp = Date.now();
        const fileExt = avatarFile.name.split('.').pop()?.toLowerCase();
        const fileName = `avatar_${timestamp}.${fileExt}`;
        
        // Upload file to storage
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            upsert: true
          });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error("Failed to upload avatar: " + uploadError.message);
          setIsLoading(false);
          return;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        finalAvatarUrl = urlData.publicUrl;
      }
      
      // Prepare data to update
      const updateData: Record<string, any> = {
        username: username,
        setup_completed: true
      };
      
      // Include avatar_url if we have one
      if (finalAvatarUrl) {
        updateData.avatar_url = finalAvatarUrl;
      }
      
      // Update in database
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', session.user.id);
        
      if (error) throw error;
      
      // Update session
      const sessionUpdate: any = {
        ...session,
        user: {
          ...session?.user,
          name: username
        }
      };
      
      if (finalAvatarUrl) {
        sessionUpdate.user.image = finalAvatarUrl;
      }
      
      await update(sessionUpdate);
      
      setSetupCompleted(true);
      toast.success("Profile updated successfully!");
      
      // Close dialog
      setTimeout(() => setOpen(false), 1500);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
      setAvatarFile(null);
    }
  };
  
  // Skip button handler
  const handleSkip = async () => {
    if (!session?.user?.id) return;
    
    const supabase = getClient();
    if (!supabase) return;
    
    try {
      await supabase
        .from('users')
        .update({ setup_completed: true })
        .eq('id', session.user.id);
        
      setSetupCompleted(true);
      setOpen(false);
    } catch (err) {
      console.error("Error skipping setup:", err);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStepRef.current === 1 ? "Choose Your Username" : "Add Profile Picture"}
          </DialogTitle>
          <DialogDescription>
            {currentStepRef.current === 1 
              ? "Please choose a username that will identify you to other users."
              : "Upload a profile picture to personalize your account."
            }
          </DialogDescription>
        </DialogHeader>
        
        {currentStepRef.current === 1 ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-full"
              />
            </div>
            <DialogFooter>
              <div className="w-full rounded-full z-5 p-0.5 gradient-border">
                <Button 
                  onClick={handleContinueToAvatar} 
                  disabled={!username.trim()}
                  className="w-full relative rounded-full bg-black disabled:bg-black hover:bg-zinc-800"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.5} />
                </Button>
              </div>
            </DialogFooter>
          </div>
        ) : (
          // Modified avatar section with simplified workflow
<div className="space-y-4 py-4">
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="relative h-24 w-24 rounded-full overflow-hidden">
      {/* Image or placeholder */}
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt="Profile avatar preview"
          fill
          className="object-cover"
        />
      ) : avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Profile avatar"
          fill
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full bg-zinc-100 flex items-center justify-center">
          <Upload className="h-8 w-8 text-zinc-400" />
        </div>
      )}
      
      {/* Upload button overlay */}
      <label htmlFor="avatar-upload" className="absolute inset-0 h-full w-full bg-black/40 flex items-center justify-center cursor-pointer">
        <Camera className="h-7 w-7 text-white/80" strokeWidth={2.5} />
        <input
          id="avatar-upload"
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileChange}
        />
      </label>
    </div>
    
    {/* Single Save Profile button that handles both upload and save */}
    <DialogFooter className="space-y-3 w-full">
      <div className="relative w-full">
        <div className="w-full absolute inset-0 rounded-full z-5 p-0.5 gradient-border">
          <Button 
            onClick={handleSaveProfile}
            disabled={isLoading}
            className="w-full relative rounded-full bg-black hover:bg-zinc-800"
          >
            {isLoading ? "Saving..." : "Save Profile"}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        </div>   
      </div>
    </DialogFooter>
  </div>
</div>
        )}
      </DialogContent>
    </Dialog>
  );
};