import { z } from "zod";

export const createRoomSchema = z.object({
  roomName: z.string().min(2).max(50),
  maxMembers: z.coerce.number().int().min(2).max(50),
});

export const joinRoomSchema = z.object({
  roomId: z
    .string()
    .min(6)
    .max(12)
    .transform((v) => v.toUpperCase().trim()),
});

export const adminBanSchema = z.object({
  userId: z.string().min(1),
  banned: z.boolean(),
});

export const adminRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin"]),
});
