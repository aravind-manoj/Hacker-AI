import SettingsSection from "../_components/sections/settings";
import { Cog } from "lucide-react";

export const Sections = [
  {
    title: "Settings",
    href: "/settings",
    section: <SettingsSection />,
    icon: <Cog />,
  },
];
