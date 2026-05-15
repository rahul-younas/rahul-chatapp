import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30",
        secondary: "bg-zinc-800 text-zinc-300 border border-zinc-700",
        success: "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30",
        destructive: "bg-red-600/20 text-red-300 border border-red-500/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
