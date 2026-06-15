"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyToken, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"verifying" | "error" | "success">("verifying");
  const [error, setError] = useState("");

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("No verification token found. Please request a new magic link.");
      return;
    }

    verifyToken(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 1500);
      })
      .catch((err: any) => {
        setStatus("error");
        setError(
          err.response?.data?.error?.message ||
            "Invalid or expired magic link. Please request a new one.",
        );
      });
  }, [searchParams, verifyToken, router]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 text-center">
          {status === "verifying" && (
            <>
              <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                Verifying...
              </h2>
              <p className="text-slate-400 text-sm">
                Please wait while we verify your magic link.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                Signed In!
              </h2>
              <p className="text-slate-400 text-sm">
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                Verification Failed
              </h2>
              <p className="text-slate-400 text-sm mb-6">{error}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Request New Link
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
