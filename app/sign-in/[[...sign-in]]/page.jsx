import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <div className="clerk-auth-page flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <SignIn appearance={clerkAppearance} />
    </div>
  );
}
