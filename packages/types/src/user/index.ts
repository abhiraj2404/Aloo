import z, { email } from "zod";

export const UserSchema = z.object({
    id: z.cuid(),
    email: z.email(),
    password: z.string().min(6, "Password must be of minimum 6 characters"),
    name: z.string()
});

export const CreateUserSchema = UserSchema.omit({id: true});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const LoginUserSchema = UserSchema.omit({id:true, name: true});
export type LoginUserInput = z.infer<typeof LoginUserSchema>;

export type User = z.infer<typeof UserSchema>;


