"use server";

import {
  getWorkspaces as _getWorkspaces,
  createWorkspace as _createWorkspace,
  updateWorkspace as _updateWorkspace,
  deleteWorkspace as _deleteWorkspace,
} from "./workspace-crud";

import {
  getWorkspaceMembers as _getWorkspaceMembers,
  getPendingWorkspaceInvitations as _getPendingWorkspaceInvitations,
  inviteMember as _inviteMember,
  acceptWorkspaceInvitation as _acceptWorkspaceInvitation,
  revokeWorkspaceInvitation as _revokeWorkspaceInvitation,
  removeMember as _removeMember,
  updateMemberRole as _updateMemberRole,
} from "./workspace-members";

export async function getWorkspaces() {
  return _getWorkspaces();
}

export async function createWorkspace(name: string, slug: string) {
  return _createWorkspace(name, slug);
}

export async function updateWorkspace(
  workspaceId: string,
  name: string,
  slug: string,
  shortPrefix: string
) {
  return _updateWorkspace(workspaceId, name, slug, shortPrefix);
}

export async function deleteWorkspace(workspaceId: string) {
  return _deleteWorkspace(workspaceId);
}

export async function getWorkspaceMembers(workspaceId: string) {
  return _getWorkspaceMembers(workspaceId);
}

export async function getPendingWorkspaceInvitations(workspaceId: string) {
  return _getPendingWorkspaceInvitations(workspaceId);
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: "owner" | "admin" | "viewer"
) {
  return _inviteMember(workspaceId, email, role);
}

export async function acceptWorkspaceInvitation(token: string) {
  return _acceptWorkspaceInvitation(token);
}

export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string
) {
  return _revokeWorkspaceInvitation(workspaceId, invitationId);
}

export async function removeMember(workspaceId: string, memberId: string) {
  return _removeMember(workspaceId, memberId);
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: "owner" | "admin" | "viewer"
) {
  return _updateMemberRole(workspaceId, memberId, newRole);
}
