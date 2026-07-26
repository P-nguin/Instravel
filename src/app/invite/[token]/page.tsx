import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function InvitePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser(); 

  if (!user) {
    // Send them to login, then bounce them right back to this exact invite link
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  // 1. Find the token
  const shareToken = await db.shareToken.findUnique({
    where: { token }
  });

  if (!shareToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="surface p-8 text-center max-w-sm">
          <h1 className="text-lg font-bold text-ink">Invalid Invite</h1>
          <p className="text-sm text-stone-500 mt-2">This link may have expired or does not exist.</p>
        </div>
      </div>
    );
  }

  // 2. Check if the user is the owner (so we don't downgrade their permissions)
  const trip = await db.trip.findUnique({
    where: { id: shareToken.tripId }
  });

  if (trip?.ownerId !== user.id) {
    // 3. Upsert the user as a member (adds them if new, does nothing if they already exist)
    // We use "editor" to keep it compatible with your existing API logic
    await db.tripMember.upsert({
      where: {
        tripId_userId: {
          tripId: shareToken.tripId,
          userId: user.id
        }
      },
      update: {},
      create: {
        tripId: shareToken.tripId,
        userId: user.id,
        role: "editor" 
      }
    });
  }

  // 4. Send them directly into the trip board
  redirect(`/trips/${shareToken.tripId}`);
}