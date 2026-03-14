import { redirect } from "next/navigation";
import { Sections } from "../_components/sections";

export default async function Page({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  return <>{Sections.find((x) => x.href === `/${path}`)?.section ?? redirect("/dashboard")}</>;
}
