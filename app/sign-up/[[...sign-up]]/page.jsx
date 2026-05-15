import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="clerk-auth-page flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
  <div className="w-full max-w-md">
    <SignUp appearance={clerkAppearance} />
  </div>
</div>
  );
}
