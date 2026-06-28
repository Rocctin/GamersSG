"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isOrganiser } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function OrganiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && isAuthenticated && !isOrganiser(user)) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !isOrganiser(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
