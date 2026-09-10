import bcrypt from "bcryptjs";
import { userRepo } from "../repositories/user.repo.js";
import type { Role } from "@prisma/client";

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const authService = {
  async register(input: {
    email: string;
    password: string;
    role: Role;
    name?: string;
  }) {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) {
      throw new AuthError("email_taken", "Email already registered", 409);
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userRepo.createWithProfile({
      email: input.email,
      passwordHash,
      role: input.role,
      name: input.name,
    });
    return { id: user.id, email: user.email, role: user.role };
  },

  async login(input: { email: string; password: string }) {
    const user = await userRepo.findByEmail(input.email);
    if (!user) {
      throw new AuthError("invalid_credentials", "Invalid email or password", 401);
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new AuthError("invalid_credentials", "Invalid email or password", 401);
    }
    return { id: user.id, email: user.email, role: user.role };
  },
};
