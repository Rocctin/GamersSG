"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Gamepad2, ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { requestMagicLink, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [devMagicLink, setDevMagicLink] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const link = await requestMagicLink(email.trim());
      setDevMagicLink(link ?? null);
      setIsSent(true);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        {/* Card */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Gamepad2 className="h-5 w-5 text-brand-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              Gamers<span className="text-brand-500">.SG</span>
            </h1>
          </div>

          {!isSent ? (
            <>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">
                Sign In
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Enter your email and we&apos;ll send you a magic link to sign in instantly.
              </p>

              <form onSubmit={handleSubmit}>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      Send Magic Link <ArrowLeft className="h-4 w-4 rotate-180" />
                    </>
                  )}
                </button>
              </form>

              {/* Link to register */}
              <p className="text-center text-slate-400 text-sm mt-6">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-brand-500 hover:text-brand-400 transition-colors font-medium"
                >
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                Check Your Email
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                We sent a magic link to <strong className="text-slate-300">{email}</strong>. Click the link to sign in.
              </p>

              {devMagicLink && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-left">
                  <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    🔧 Dev Mode — No email sent
                  </p>
                  <p className="text-slate-300 text-xs mb-3">
                    Resend is not configured. Click the link below to sign in:
                  </p>
                  <a
                    href={devMagicLink}
                    className="block w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors text-center"
                  >
                    Open Magic Link →
                  </a>
                  <p className="text-slate-500 text-xs mt-2 break-all">
                    {devMagicLink}
                  </p>
                </div>
              )}

              <button
                onClick={() => { setIsSent(false); setDevMagicLink(null); }}
                className="text-brand-500 hover:text-brand-400 text-sm transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
