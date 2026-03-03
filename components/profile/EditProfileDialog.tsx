"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { api } from "@/app/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUserStore } from "@/app/store/useUserStore";

export function EditProfileDialog({ profile, children }: { profile: any, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    avatar: profile.avatar || "",
    coverImage: profile.coverImage || "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar || null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile.coverImage || null);

  const queryClient = useQueryClient();
  const { user, setUser } = useUserStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setAvatarFile(file);
      const fileUrl = URL.createObjectURL(file);
      setAvatarPreview(fileUrl);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setBannerFile(file);
      const fileUrl = URL.createObjectURL(file);
      setBannerPreview(fileUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let finalAvatarUrl = formData.avatar;
      let finalBannerUrl = formData.coverImage;

      const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "gateway.pinata.cloud";

      const uploadToPinata = async (file: File) => {
        const signRes = await api.get(`/api/upload/sign?name=${encodeURIComponent(file.name)}`);
        const signData = signRes.data as any;
        
        if (!signData.success || !signData.url) throw new Error("Failed to get presigned URL");

        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("network", "public");

        const uploadRes = await axios.post(signData.url, uploadData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const uploadResult = uploadRes.data;
        if (!uploadResult.data) throw new Error("Pinata upload failed");
        
        return `https://${gatewayUrl}/ipfs/${uploadResult.data.cid}`;
      };

      const deleteOldFile = async (oldUrl: string) => {
        if (!oldUrl || !oldUrl.includes("/ipfs/")) return;
        const cid = oldUrl.split("/ipfs/")[1]?.split(/[/?#]/)[0];
        if (cid) {
          try {
            await api.delete("/api/upload/delete", {
              data: { cid }
            });
          } catch (e) {
            console.error("Failed to delete old file", e);
          }
        }
      };

      // 1. Upload new avatar if selected
      if (avatarFile) {
        finalAvatarUrl = await uploadToPinata(avatarFile);
        if (formData.avatar && formData.avatar !== finalAvatarUrl) {
          await deleteOldFile(formData.avatar);
        }
      }

      // 2. Upload new banner if selected
      if (bannerFile) {
        finalBannerUrl = await uploadToPinata(bannerFile);
        if (formData.coverImage && formData.coverImage !== finalBannerUrl) {
          await deleteOldFile(formData.coverImage);
        }
      }

      // 3. Patch user profile
      const payload = {
        ...formData,
        avatar: finalAvatarUrl,
        coverImage: finalBannerUrl,
      };

      const response = await api.patch(`/api/users/${profile._id}`, payload);
      
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
      
      // Instantly update global logged-in user state if they are editing their own profile
      if (user?._id === profile._id) {
        setUser({ ...user, ...(response.data?.data || payload) });
      }
      
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            
            {/* Banner & Avatar Upload Section */}
            <div className="flex flex-col gap-2 mb-2">
              {/* Banner Upload */}
              <div className="relative h-28 w-full bg-muted rounded-t-lg overflow-hidden border border-border flex items-center justify-center group">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner preview" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-muted-foreground text-sm">No Banner Image</span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Label htmlFor="banner-upload" className="cursor-pointer text-white text-sm font-medium hover:underline">
                    Change Banner
                  </Label>
                  <Input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerFileChange}
                  />
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-2 -mt-12 z-10">
                <Avatar className="w-20 h-20 border-4 border-background">
                  <AvatarImage src={avatarPreview || ""} alt="Avatar preview" className="object-cover" />
                  <AvatarFallback>{formData.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer text-xs text-primary hover:underline">
                    Change Profile Photo
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
