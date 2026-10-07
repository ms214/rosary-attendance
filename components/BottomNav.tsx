"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/check-in", label: "출석", icon: "📷" },
  { href: "/rosary", label: "묵주기도", icon: "📿" },
  { href: "/calendar", label: "도장판", icon: "📅" },
];

// 네비게이션을 숨길 경로
const HIDDEN = ["/login", "/signup"];

export default function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-primary-soft bg-white">
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                  active ? "text-primary font-semibold" : "text-gray-400"
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
