"use client";

import { useEffect, useState } from "react";
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
import { createSupabaseClient } from "@/utils/supabase/retrieveData";

import { UserPlus, Upload, Check, ArrowRight } from "lucide-react";

// Step 1: Username, Step 2: Profile Picture
type ProfileSetupStep = 1 | 2;

export const ProfileSetupDialog = () => {
  const { data: session, update } = useSession();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ProfileSetupStep>(1);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if the user profile needs setup
  useEffect(() => {
    if (session?.user) {
      // Initialize username from session if available
      if (session.user.name && session.user.name !== session.user.walletAddress) {
        setUsername(session.user.name);
      }
      
      // Don't show the dialog if both are set AND username is not just the wallet address
      const hasRealUsername = session.user.name && session.user.name !== session.user.walletAddress;
      const hasAvatar = !!session.user.image;
      
      if (!hasRealUsername || !hasAvatar) {
        setOpen(true);
        
        // Set initial step based on what's missing first
        if (!hasRealUsername) {
          setStep(1);
        } else if (!hasAvatar) {
          setStep(2);
        }
      }
    }
  }, [session]);
  
  // Update username
  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const supabase = createSupabaseClient();
      
      // Update username in database
      const { error } = await supabase
        .from('users')
        .update({ username: username })
        .eq('wallet_address', session?.user?.walletAddress);
        
      if (error) throw error;
      
      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: username
        }
      });
      
      toast.success("Username updated successfully!");
      
      // Check if avatar is also missing, if so go to step 2, otherwise close
      if (!session?.user.image) {
        setStep(2);
      } else {
        setTimeout(() => {
          setOpen(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Profile picture upload complete handler
  const handleAvatarUploadComplete = async (res: { url: string }[]) => {
    if (res && res[0]?.url) {
      setAvatarUrl(res[0].url);
      
      try {
        const supabase = createSupabaseClient();
        
        // Update profile pic in database
        const { error } = await supabase
          .from('users')
          .update({ avatar_url: res[0].url })
          .eq('wallet_address', session?.user?.walletAddress);
          
        if (error) throw error;
        
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            image: res[0].url
          }
        });
        
        toast.success("Profile picture updated successfully!");
        
        // Close dialog since we're done with setup
        setTimeout(() => {
          setOpen(false);
        }, 1500);
      } catch (error) {
        console.error("Error updating profile picture:", error);
        toast.error("Failed to update profile picture");
      }
    }
  };
  
  // Handle avatar upload error
  const handleAvatarUploadError = (error: Error) => {
    console.error("Error uploading avatar:", error);
    toast.error("Failed to upload profile picture");
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {step === 1 ? "Set Your Username" : "Add Profile Picture"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Please choose a username that will identify you to other users."
              : "Upload a profile picture to personalize your account."
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button 
                onClick={handleUsernameSubmit} 
                disabled={isLoading || !username.trim()}
                className="w-full"
              >
                {isLoading ? "Saving..." : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
            
            <DialogFooter>
              <Button 
                onClick={() => setOpen(false)}
                variant="outline"
                className="w-full"
                disabled={!avatarUrl}
              >
                {avatarUrl ? "Complete Setup" : "Skip for Now"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};