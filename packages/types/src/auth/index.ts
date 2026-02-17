// example code 
import z from 'zod';


// --- 1. Schemas (Runtime Validation) ---

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, "Password must be at least 6 chars"),
});

export const RegisterSchema = LoginSchema.extend({
  name: z.string().min(2),
  role: z.enum(["OWNER", "STAFF"]),
});

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
});

// --- 2. Types (Static Type Checking) ---

// Zod automatically creates the interface for you
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;