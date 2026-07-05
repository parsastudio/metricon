"use client";

import * as React from "react";
import {
  inviteMember,
  removeMember,
  updateMemberRole,
  revokeWorkspaceInvitation,
  getPendingWorkspaceInvitations,
} from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { User, Trash2, MailPlus, Shield, Hourglass, Ban } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { IS_DEMO_MODE } from "@/core/config";
import { Member, PendingInvite } from "@/lib/validations";

interface TeamMembersProps {
  workspaceId: string;
  initialMembers: Member[];
  currentUserRole: "owner" | "admin" | "viewer";
}

export function TeamMembers({
  workspaceId,
  initialMembers,
  currentUserRole,
}: TeamMembersProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"owner" | "admin" | "viewer">(
    "viewer"
  );
  const [loading, setLoading] = React.useState(false);
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvite[]>(
    []
  );

  React.useEffect(() => {
    async function loadInvitations() {
      try {
        const invites = await getPendingWorkspaceInvitations(workspaceId);
        setPendingInvites(
          invites.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role as "owner" | "admin" | "viewer",
            expiresAt: new Date(i.expiresAt),
          }))
        );
      } catch {
        toast.error("Failed to fetch pending invitations.");
      }
    }
    loadInvitations();
  }, [workspaceId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await inviteMember(workspaceId, email, role);
      if (res.success) {
        setEmail("");
        if (res.isDemo) {
          toast.success(
            "Sandbox Instant Invite: User auto-provisioned to organization!"
          );
        } else {
          toast.success("Security token invitation dispatched successfully.");
        }
        router.refresh();
        const invites = await getPendingWorkspaceInvitations(workspaceId);
        setPendingInvites(
          invites.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role as "owner" | "admin" | "viewer",
            expiresAt: new Date(i.expiresAt),
          }))
        );
      } else {
        toast.error(res.error || "An error occurred");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await removeMember(workspaceId, memberId);
      if (res.success) {
        toast.success("Member removed successfully");
        router.refresh();
      } else {
        toast.error("Failed to remove member: " + res.error);
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: "owner" | "admin" | "viewer"
  ) => {
    try {
      const res = await updateMemberRole(workspaceId, memberId, newRole);
      if (res.success) {
        toast.success("Member role updated successfully");
        router.refresh();
      } else {
        toast.error("Failed to update member role");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation token?"))
      return;
    try {
      const res = await revokeWorkspaceInvitation(workspaceId, inviteId);
      if (res.success) {
        setPendingInvites(pendingInvites.filter((p) => p.id !== inviteId));
        toast.success("Invitation code revoked successfully");
      } else {
        toast.error("Failed to revoke invite.");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      {currentUserRole !== "viewer" && (
        <form
          onSubmit={handleInvite}
          className="bg-card border-border space-y-4 rounded-xl border p-5"
        >
          <div className="flex items-center gap-2">
            <MailPlus className="text-primary size-5" />
            <h3 className="text-sm font-semibold">Invite New Member</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-border focus:border-primary w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-hidden"
            />
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "owner" | "admin" | "viewer")
              }
              className="border-border bg-background focus:border-primary w-full cursor-pointer rounded-md border px-3 py-1.5 text-sm outline-hidden"
            >
              <option value="owner">Owner (Full access)</option>
              <option value="admin">Admin (Modify links)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
            <Button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer"
            >
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
          {IS_DEMO_MODE && (
            <p className="text-primary text-[10px] leading-relaxed">
              * DEMO MODE: Inviting immediately creates active user record in
              database. Turn off NEXT_PUBLIC_DEMO_MODE to test Resend email
              token flows.
            </p>
          )}
        </form>
      )}

      {pendingInvites.length > 0 && (
        <div className="bg-card border-border overflow-hidden rounded-xl border">
          <div className="border-border flex items-center justify-between border-b px-5 py-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
              <Hourglass className="size-4" /> Pending Invitation Tokens
            </h3>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
              {pendingInvites.length} pending
            </span>
          </div>
          <div className="divide-border divide-y">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div>
                  <div className="text-foreground text-sm font-medium">
                    {invite.email}
                  </div>
                  <div className="text-muted-foreground font-mono text-xs">
                    Expires: {invite.expiresAt.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="border-border bg-muted flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                    <Shield className="text-primary size-3" />
                    {invite.role}
                  </span>
                  {currentUserRole !== "viewer" && (
                    <button
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg p-1.5 transition-colors"
                    >
                      <Ban className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border-border overflow-hidden rounded-xl border">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-sm font-semibold">Active Workspace Members</h3>
          <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">
            {initialMembers.length} members
          </span>
        </div>
        <div className="divide-border divide-y">
          {initialMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-4 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="bg-secondary border-border flex size-10 items-center justify-center rounded-full border">
                  <User className="text-muted-foreground size-5" />
                </div>
                <div>
                  <div className="text-foreground text-sm font-medium">
                    {member.user.name || "Pending Member"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {member.user.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {currentUserRole === "owner" && member.role !== "owner" ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleUpdateRole(
                        member.id,
                        e.target.value as "owner" | "admin" | "viewer"
                      )
                    }
                    className="border-border bg-background focus:border-primary cursor-pointer rounded-md border px-2.5 py-1 text-xs outline-hidden"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className="border-border bg-muted flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                    <Shield className="text-primary size-3" />
                    {member.role}
                  </span>
                )}
                {currentUserRole === "owner" && member.role !== "owner" && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg p-1.5 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
