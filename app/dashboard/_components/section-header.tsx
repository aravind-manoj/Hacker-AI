"use client";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Laptop, LogOut, Moon, Sun, SunMoon, User, UserPen, Upload, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SectionHeader() {
  const { theme, setTheme } = useTheme();
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    phone: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        image: session.user.image || "",
        phone: session.user.phone || "",
      });
    }
  }, [session?.user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    const { data, error } = await authClient.updateUser({
      name: formData.name,
      image: formData.image,
      phone: formData.phone,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to update profile");
      return;
    }
    toast.success("Profile updated successfully!");
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <section className="relative h-14 w-full flex items-center px-4 border-b border-gray-300 dark:border-gray-800 gap-4">
      <SidebarTrigger />
      <div className="absolute right-0 mr-5 h-full flex gap-5 justify-center items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer">
              <SunMoon />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Laptop /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src={session?.user?.image || "https://github.com/shadcn.png"} alt={session?.user?.name || "User"} />
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DialogTrigger asChild>
                <DropdownMenuItem className="cursor-pointer">
                  <UserPen /> My Account
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <LogOut /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="sm:max-w-md bg-[#050505] border border-red-900/50 text-white font-mono rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight text-red-500 flex items-center gap-2">
                <UserPen className="w-5 h-5" />
                My Account
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Update your hacker profile details.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5 py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-2 border-red-900/50">
                  <AvatarImage src={formData.image || session?.user?.image || "https://github.com/shadcn.png"} alt="Preview" />
                  <AvatarFallback className="bg-[#0a0a0a]"><User className="w-10 h-10 text-gray-500" /></AvatarFallback>
                </Avatar>
                <div className="flex gap-3">
                  <label className="cursor-pointer bg-[#0a0a0a] border border-red-900/40 hover:border-red-500 hover:text-red-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {formData.image && (
                    <button
                      onClick={() => setFormData({ ...formData, image: "" })}
                      className="cursor-pointer bg-[#0a0a0a] border border-red-900/40 hover:border-red-500 hover:text-red-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-red-500 font-bold uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-2 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-red-500 font-bold uppercase tracking-wider">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-2 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <DialogFooter className="items-center sm:justify-between w-full mt-2">
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest px-6"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section >
  );
}
