"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const tools = [
  {
    href: "/native",
    label: "Native",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M5 14h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M8 12v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/ads",
    label: "Ads",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 12V7l5-4 5 4v5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        <rect x="6" y="8" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    href: "/vsl",
    label: "VSL",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/>
      </svg>
    ),
  },
];

const secondary = [
  {
    href: "/train",
    label: "Treino",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2 7.5h11M7.5 2v11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    href: "/history",
    label: "Histórico",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M1.5 7.5a6 6 0 1 0 6-6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M1.5 4v3.5H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.5 5v3l2 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Configurações",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.697 2.697l1.06 1.06M11.243 11.243l1.06 1.06M2.697 12.303l1.06-1.06M11.243 3.757l1.06-1.06" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-[200px] min-h-screen bg-sidebar border-r border-border flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <NitroLogo />
          <span className="text-fg font-semibold text-[15px] tracking-tight">NitroCopy</span>
        </div>
      </div>

      {/* Main tools */}
      <nav className="p-2 flex-1">
        <div className="mb-1">
          <p className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-fg-dim">
            Ferramentas
          </p>
        </div>
        <ul className="space-y-0.5">
          {tools.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-accent-surface text-accent"
                    : "text-fg-muted hover:bg-bg-3 hover:text-fg"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-4 mb-1">
          <p className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-fg-dim">
            Workspace
          </p>
        </div>
        <ul className="space-y-0.5">
          {secondary.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] transition-colors",
                  pathname === item.href
                    ? "bg-accent-surface text-accent"
                    : "text-fg-muted hover:bg-bg-3 hover:text-fg"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] text-fg-muted hover:bg-bg-3 hover:text-fg transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M5.5 1.5h-3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 10.5l3-3-3-3M13 7.5H5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sair
        </button>
      </div>
    </aside>
  );
}

function NitroLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <polygon points="11,1 21,6 21,16 11,21 1,16 1,6" fill="#1F51FF" opacity="0.15" stroke="#1F51FF" strokeWidth="1.5"/>
      <path d="M7 15V8l8 7V8" stroke="#1F51FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
