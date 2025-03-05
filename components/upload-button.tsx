// components/upload-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { getSession } from "next-auth/react";

interface UploadButtonProps {
  endpoint: string;
  children: React.ReactNode;
  onClientUploadComplete?: (res: { url: string }[]) => void;
  onUploadError?: (error: Error) => void;
}

export const UploadButton = ({
  endpoint,
  children,
  onClientUploadComplete,
  onUploadError,
}: UploadButtonProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const session = await getSession();
      if (!session?.user?.id) return;

      const supabase = getSupabase(session);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${endpoint}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('user-content')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);

      onClientUploadComplete?.([{ url: publicUrl }]);
    } catch (error) {
      onUploadError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
        disabled={isUploading}
      />
      <label htmlFor="file-upload">
        {typeof children === 'string' ? (
          <Button disabled={isUploading}>
            {isUploading ? 'Uploading...' : children}
          </Button>
        ) : (
          children
        )}
      </label>
    </div>
  );
};