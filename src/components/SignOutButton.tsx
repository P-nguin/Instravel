import { signOut } from "@/auth"

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut()
      }}
    >
      <button type="submit" className="text-sm font-medium text-gray-600 hover:text-gray-900">
        Sign Out
      </button>
    </form>
  )
}