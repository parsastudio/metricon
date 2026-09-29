"use server";

import { db } from "@/lib/db";
import { workspaces, workspaceMembers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { verifyWorkspaceAccess } from "@/lib/rbac";
import { getWorkspaceAnalytics } from "@/actions/analytics";
import { sendEmail } from "@/lib/resend";

export async function sendWeeklyWorkspaceReport(workspaceId: string) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner", "admin"]);
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return { success: false, error: "WORKSPACE_NOT_FOUND" };
    }

    const members = await db
      .select({ email: users.email })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.role, "owner")
        )
      );

    const analyticsData = await getWorkspaceAnalytics(workspaceId, "7d");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-bottom: 4px;">Metricon Performance Digest</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Weekly report for <strong>${workspace.name}</strong></p>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Total Click Traffic</span>
            <h3 style="color: #0f172a; font-size: 24px; margin: 4px 0 0 0;">${analyticsData.kpi.totalClicks.toLocaleString()}</h3>
          </div>
          <div>
            <span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Unique Interactions</span>
            <h3 style="color: #0f172a; font-size: 24px; margin: 4px 0 0 0;">${analyticsData.kpi.uniqueClicks.toLocaleString()}</h3>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="color: #0f172a; margin-bottom: 8px;">Top Performing Link</h4>
          <p style="color: #0284c7; font-weight: 600; margin: 0;">${analyticsData.kpi.topLink}</p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
          <h4 style="color: #0f172a; margin-bottom: 12px;">Geographic Origin Distribution</h4>
          ${analyticsData.countries
            .slice(0, 5)
            .map(
              (c) => `
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; color: #334155;">
              <span>${c.name}</span>
              <strong>${c.value} clicks</strong>
            </div>
          `
            )
            .join("")}
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
          <h4 style="color: #0f172a; margin-bottom: 12px;">Device Segment breakdown</h4>
          ${analyticsData.devices
            .map(
              (d) => `
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; color: #334155;">
              <span>${d.name}</span>
              <strong>${d.value} clicks</strong>
            </div>
          `
            )
            .join("")}
        </div>

        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          © Metricon link platform. All rights reserved.
        </p>
      </div>
    `;

    const results = await Promise.allSettled(
      members.map((m) =>
        sendEmail({
          to: m.email,
          subject: `Metricon Digest: ${workspace.name}`,
          html,
        })
      )
    );

    const hasSuccessfulDispatch = results.some(
      (r) => r.status === "fulfilled" && r.value.success
    );

    if (!hasSuccessfulDispatch && members.length > 0) {
      return { success: false, error: "EMAIL_DISPATCH_FAILURE" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}
