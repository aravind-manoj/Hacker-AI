import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { system, vulnerability } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid4 } from 'uuid';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    const body = await req.json();
    const secretKey = body["secret-key"];

    if (!secretKey) {
      return NextResponse.json(
        { error: "Secret key is required." },
        { status: 400 }
      );
    }

    const sysList = await db.select().from(system).where(eq(system.id, agentId));

    if (sysList.length === 0) {
      return NextResponse.json(
        { error: "Agent not found." },
        { status: 404 }
      );
    }

    const sys = sysList[0];

    // Validate the request with the secret-key
    if (sys.secretKey !== secretKey) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid secret key." },
        { status: 401 }
      );
    }

    // Process vulnerabilities
    const scanData = body.scan_data;
    if (scanData && scanData.Results) {
      const existingVulns = await db.select({ vulnId: vulnerability.vulnId })
        .from(vulnerability)
        .where(eq(vulnerability.systemId, agentId));

      const existingVulnIds = new Set(existingVulns.map(v => v.vulnId));
      const newVulnerabilities = [];
      const seenVulnIds = new Set(); // To prevent duplicates in the same scan

      for (const result of scanData.Results) {
        if (result.Vulnerabilities) {
          for (const vuln of result.Vulnerabilities) {
            if (!existingVulnIds.has(vuln.VulnerabilityID) && !seenVulnIds.has(vuln.VulnerabilityID)) {
              newVulnerabilities.push({
                id: uuid4(),
                userId: sys.userId,
                systemId: agentId,
                vulnId: vuln.VulnerabilityID,
                title: vuln.Title || "Unknown",
                description: vuln.Description || "",
                severity: vuln.Severity || "UNKNOWN",
                isFixed: false,
                status: "not_fixed",
              });
              seenVulnIds.add(vuln.VulnerabilityID);
            }
          }
        }
      }

      if (newVulnerabilities.length > 0) {
        await db.insert(vulnerability).values(newVulnerabilities);
      }
    }

    // You could update a 'last_seen' timestamp here if it existed, 
    // or just return successfully acknowledging the check-in
    await db.update(system).set({ status: "connected" }).where(eq(system.id, agentId));

    return NextResponse.json(
      { message: "Agent check-in successful." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Agent checkin error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
