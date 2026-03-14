"use client";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Laptop, LogOut, Moon, Sun, SunMoon, User, UserPen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default function SectionHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="relative h-14 w-full flex border-b border-gray-300 dark:border-gray-800">
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

        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
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
              <DropdownMenuItem className="cursor-pointer">
                <LogOut /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="sm:max-w-[85%] min-h-[400px]">
            <DialogHeader>
              <DialogTitle>My Account</DialogTitle>
            </DialogHeader>
            <div className=""></div>
            <DialogFooter className="items-end">
              <Button variant={"outline"} className="cursor-pointer" onClick={() => {}}>
                Cancel
              </Button>
              <Button className="cursor-pointer" onClick={() => {}}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
