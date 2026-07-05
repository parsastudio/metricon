import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
});

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50),
  plan: z.enum(["free", "pro"]),
});

export type Workspace = z.infer<typeof workspaceSchema>;

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9-]+$/),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9-]+$/),
  shortPrefix: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9-]+$/),
});

export const inviteMemberSchema = z.object({
  workspaceId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "viewer"]),
});

export const memberSchema = z.object({
  id: z.string(),
  role: z.enum(["owner", "admin", "viewer"]),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email(),
    image: z.string().nullable(),
  }),
});

export type Member = z.infer<typeof memberSchema>;

export const pendingInviteSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "viewer"]),
  expiresAt: z.date(),
});

export type PendingInvite = z.infer<typeof pendingInviteSchema>;

export const createLinkSchema = z.object({
  workspaceId: z.string().min(1),
  originalUrl: z.string().url(),
  shortCode: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9-]+$/),
  title: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
  maxClicks: z.number().int().positive().optional(),
  iosUrl: z.string().url().optional().or(z.literal("")),
  androidUrl: z.string().url().optional().or(z.literal("")),
  desktopUrl: z.string().url().optional().or(z.literal("")),
  geoRouting: z.record(z.string(), z.string().url()).optional(),
});

export const updateLinkSchema = z.object({
  linkId: z.string().min(1),
  workspaceId: z.string().min(1),
  originalUrl: z.string().url(),
  title: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
  maxClicks: z.number().int().positive().optional(),
  iosUrl: z.string().url().optional().or(z.literal("")),
  androidUrl: z.string().url().optional().or(z.literal("")),
  desktopUrl: z.string().url().optional().or(z.literal("")),
  geoRouting: z.record(z.string(), z.string().url()).optional(),
});

export const linkSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  shortCode: z.string(),
  originalUrl: z.string().url(),
  title: z.string().nullable(),
  isActive: z.boolean(),
  password: z.string().nullable().optional(),
  expiresAt: z.union([z.date(), z.string()]).nullable().optional(),
  clicksCount: z.number().int(),
  iosUrl: z.string().nullable().optional(),
  androidUrl: z.string().nullable().optional(),
  desktopUrl: z.string().nullable().optional(),
  geoRouting: z.record(z.string(), z.string().url()).nullable().optional(),
});

export type LinkItem = z.infer<typeof linkSchema>;
