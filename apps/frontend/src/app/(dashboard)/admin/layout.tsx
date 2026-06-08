"use client";

import { useAuth } from "@/hooks/use-auth";
import { isAdmin } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin(user)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;
  if (!isAdmin(user)) return null;

  return (
    <div className="space-y-6">
      {/* Admin banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <ShieldAlert className="h-5 w-5 text-amber-500" />
        <p className="text-sm text-amber-400">
          You are in the admin area. All actions are logged for audit purposes.
        </p>
      </div>
      {children}
    </div>
  );
}
