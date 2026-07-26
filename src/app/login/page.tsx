import SignInButton from "@/components/SignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="surface w-full max-w-md p-10 text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">Welcome to Instravel</h2>
          <p className="mt-2 text-sm text-stone-500">
            Sign in to create routes, manage trips, and collaborate with
            friends.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <SignInButton callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
