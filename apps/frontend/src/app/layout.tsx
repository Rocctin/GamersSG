import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Gamers.SG — Singapore's Gaming Identity Platform",
  description:
    "Join Singapore's national digital membership platform for gamers. Verified identity, competitive profiles, teams, tournaments, and more — powered by SCOGA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-950 text-slate-300 font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#e2e8f0",
                border: "1px solid #334155",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
