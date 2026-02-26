"use client";

import React, { useState, useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CreatePostInputProps {
  user: {
    name: string;
    avatar?: string;
  };
  onSubmit: (content: string, mediaFiles: File[]) => Promise<void>;
  placeholder?: string;
}

export function CreatePostInput({ user, onSubmit, placeholder = "What's happening?" }: CreatePostInputProps) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newFiles = [...mediaFiles, ...filesArray].slice(0, 4); // Limit to 4
      
      setMediaFiles(newFiles);
      
      // Create object URLs for preview
      const urls = newFiles.map(file => URL.createObjectURL(file));
      // Cleanup old urls
      mediaUrls.forEach(url => URL.revokeObjectURL(url));
      setMediaUrls(urls);
    }
  };

  const removeMedia = (index: number) => {
    const newFiles = [...mediaFiles];
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);
    
    URL.revokeObjectURL(mediaUrls[index]);
    const newUrls = [...mediaUrls];
    newUrls.splice(index, 1);
    setMediaUrls(newUrls);
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content, mediaFiles);
      setContent("");
      setMediaFiles([]);
      mediaUrls.forEach(url => URL.revokeObjectURL(url));
      setMediaUrls([]);
    } catch (error) {
      console.error("Post creation failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex space-x-4">
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage src={user.avatar || ""} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="w-full">
          <Textarea 
            className="w-full bg-transparent border-0 focus-visible:ring-0 resize-none px-0 py-2 text-xl placeholder:text-xl placeholder:text-muted-foreground/70 min-h-[50px] overflow-hidden" 
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Media Preview Area */}
        {mediaUrls.length > 0 && (
          <div className={`mt-2 grid gap-2 ${mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} mb-4`}>
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden aspect-video bg-muted border">
                <img src={url} className="object-cover w-full h-full" alt="Upload preview" />
                <button 
                  onClick={() => removeMedia(i)}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                  disabled={isSubmitting}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-2 border-t pt-3">
          <div className="flex items-center space-x-2 text-primary">
            <input 
              type="file" 
              accept="image/*,video/*" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isSubmitting || mediaFiles.length >= 4}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || mediaFiles.length >= 4}
            >
              <ImagePlus size={20} />
            </Button>
          </div>
          
          <Button 
            className="rounded-full font-bold px-6 py-5 text-base shadow-sm hover:shadow-md transition-all" 
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
          >
            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}
