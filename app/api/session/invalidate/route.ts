import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
  redirectResponse.cookies.delete("session_token");
  return redirectResponse;
}
