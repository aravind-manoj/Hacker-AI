import { redirect } from "next/navigation";

export const deleteSessionCookie = async () => {
  "use client";
  redirect("/api/session/invalidate");
};
