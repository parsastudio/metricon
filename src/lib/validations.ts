import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9-]+$/),
});

export const inviteMemberSchema = z.object({
  workspaceId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "viewer"]),
});

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
