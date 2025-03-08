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
import { UploadButton } from "@/components/upload-button";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";

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
  const [isLoading, setIsLoading] = useState(false);
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
  
  // Handle avatar upload complete
  const handleAvatarUploadComplete = async (res: { url: string }[]) => {
    if (res && res[0]?.url) {
      setAvatarUrl(res[0].url);
      toast.success("Image uploaded successfully!");
    }
  };
  
  // Handle avatar upload error
  const handleAvatarUploadError = (error: Error) => {
    console.error("Error uploading avatar:", error);
    toast.error("Failed to upload profile picture");
  };
  
  // Save complete profile
  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    
    const supabase = getClient();
    if (!supabase) return;
    
    setIsLoading(true);
    
    try {
      // Prepare data to update
      const updateData: Record<string, any> = {
        username: username,
        setup_completed: true
      };
      
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
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
          ...session.user,
          name: username
        }
      };
      
      if (avatarUrl) {
        sessionUpdate.user.image = avatarUrl;
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
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center gap-4">
              {avatarUrl ? (
                <div className="relative h-24 w-24 rounded-full overflow-hidden">
                  <Image
                    src={avatarUrl}
                    alt="Profile avatar"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full bg-zinc-100 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-zinc-400" />
                </div>
              )}
              
              <UploadButton
                endpoint="avatars"
                onClientUploadComplete={handleAvatarUploadComplete}
                onUploadError={handleAvatarUploadError}
              >
                {avatarUrl ? "Change Profile Picture" : "Upload Profile Picture"}
              </UploadButton>
            </div>
            
            <DialogFooter className="space-y-3">
                <div className=" relative w-full">
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
        )}
      </DialogContent>
    </Dialog>
  );
};