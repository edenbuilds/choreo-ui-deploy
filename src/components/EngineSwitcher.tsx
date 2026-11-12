"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { copy } from "@/copy";

export default function EngineSwitcher({ current }: { current?: string }) {
  const pathname = usePathname();
  const S = copy.switcher;

  return (
    <nav className="engine-switcher" aria-label={S.aria}>
      <span className="engine-switcher-label">{S.label}</span>
      <ul className="engine-switcher-list">
        {copy.engines.map((e) => {
          const active = current ? current === e.id : pathname === e.href || pathname.startsWith(e.href + "/");
          return (
            <li key={e.id}>
              <Link href={e.href} className="engine-switcher-link" data-active={active || undefined} aria-current={active ? "page" : undefined}>
                {e.slug}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
