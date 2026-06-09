import { db } from "@/lib/prisma";

export async function getCurrentUser() {
  const email = process.env.CURRENT_USER_EMAIL ?? "demo@instravel.local";
  const name = process.env.CURRENT_USER_NAME ?? "Demo Traveler";

  return db.user.upsert({
    where: { email },
    update: { name },
    create: { email, name }
  });
}
