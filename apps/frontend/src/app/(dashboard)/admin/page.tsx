"use client";

import Link from "next/link";
import { Users, Building2, ClipboardList, Swords, ArrowRight } from "lucide-react";

const ADMIN_LINKS = [
  {
    label: "Manage Users",
    description: "View, search, and manage all platform users. Suspend or reinstate accounts.",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Review Organisers",
    description: "Approve or reject pending organiser applications with review workflow.",
    href: "/admin/organisers",
    icon: Building2,
  },
  {
    label: "Audit Logs",
    description: "Review all admin actions for compliance and accountability.",
    href: "/admin/audit-logs",
    icon: ClipboardList,
  },
  {
    label: "Games Library",
    description: "Manage the platform game library. Add, edit, or disable games.",
    href: "/admin/games",
    icon: Swords,
  },
];

export default function AdminPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Admin Panel</h1>
        <p className="text-slate-400 mt-1">
          Platform administration and moderation tools.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="group flex flex-col p-6 rounded-xl bg-surface-900 border border-surface-800 hover:border-brand-500/30 hover:bg-surface-800/50 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <link.icon className="h-5 w-5 text-brand-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-200 group-hover:text-brand-400 transition-colors">
              {link.label}
            </h2>
            <p className="text-sm text-slate-500 mt-1 flex-1">
              {link.description}
            </p>
            <div className="flex items-center gap-1 text-brand-500 text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
