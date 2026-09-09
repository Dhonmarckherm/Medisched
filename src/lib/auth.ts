import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  return dbUser;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
