import SettingsSection from "../_components/sections/settings";
import OverviewSection from "../_components/sections/overview";
import PentesterSection from "../_components/sections/pentester";
import SystemsSection from "../_components/sections/systems";
import RealtimeVulnsSection from "../_components/sections/realtime-vulns";
import SmartAnalyticsSection from "../_components/sections/smart-analytics";
import AlertsSection from "../_components/sections/alerts";
import ReportsSection from "../_components/sections/reports";
import ContextSection from "../_components/sections/context";
import {
  Activity,
  Terminal,
  Server,
  Radar,
  BrainCircuit,
  Bell,
  FileText,
  Globe,
  Cog
} from "lucide-react";

export const Sections = [
  {
    title: "Overview",
    href: "/overview",
    section: <OverviewSection />,
    icon: <Activity />,
  },
  {
    title: "Pentester",
    href: "/pentester",
    section: <PentesterSection />,
    icon: <Terminal />,
  },
  {
    title: "Systems",
    href: "/systems",
    section: <SystemsSection />,
    icon: <Server />,
  },
  {
    title: "Realtime Vulns",
    href: "/realtime-vulns",
    section: <RealtimeVulnsSection />,
    icon: <Radar />,
  },
  // {
  //   title: "Smart Analytics",
  //   href: "/smart-analytics",
  //   section: <SmartAnalyticsSection />,
  //   icon: <BrainCircuit />,
  // },
  // {
  //   title: "Alerts",
  //   href: "/alerts",
  //   section: <AlertsSection />,
  //   icon: <Bell />,
  // },
  {
    title: "Reports",
    href: "/reports",
    section: <ReportsSection />,
    icon: <FileText />,
  },
  // {
  //   title: "Context",
  //   href: "/context",
  //   section: <ContextSection />,
  //   icon: <Globe />,
  // },
  {
    title: "Settings",
    href: "/settings",
    section: <SettingsSection />,
    icon: <Cog />,
  },
];
