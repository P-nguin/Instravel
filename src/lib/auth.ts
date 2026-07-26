import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    // Return null or handle unauthenticated users
    return null;
  }

  // Retrieve or create the DB record for the authenticated user
  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}
