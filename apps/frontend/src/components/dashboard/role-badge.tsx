import type { Role } from "@gamers-sg/shared/enums";

const ROLE_STYLES: Record<Role, string> = {
  GAMER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ORGANISER: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ADMIN: "bg-brand-500/10 text-brand-500 border-brand-500/20",
};

const ROLE_LABELS: Record<Role, string> = {
  GAMER: "Gamer",
  ORGANISER: "Organiser",
  ADMIN: "Admin",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${ROLE_STYLES[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
