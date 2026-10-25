"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeControl } from "./theme-control";
const destinations = [
  { href: "/", label: "The lesson" },
  { href: "/learn", label: "Learning practice" },
  { href: "/play", label: "Play" },
  { href: "/review", label: "Review" },
  { href: "/pilot", label: "Pilot guide" },
  { href: "/evaluation", label: "Local results" },
  { href: "/board", label: "Practice board" },
];
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const previousPath = useRef(pathname);
  useEffect(() => {
    const main = document.getElementById("main");
    if (main) main.tabIndex = -1;
    if (previousPath.current !== pathname) main?.focus({ preventScroll: true });
    previousPath.current = pathname;
  }, [pathname]);
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link
          href="/"
          className="wordmark"
          aria-label="Quiet Chess home"
          onClick={() => setOpen(false)}
        >
          <span className="brand-symbol">
            <Image
              src="/brand/icon-192.png"
              alt=""
              width={44}
              height={44}
              priority
              unoptimized
            />
          </span>
          <span>Quiet Chess</span>
        </Link>
        <div className="header-actions">
          <ThemeControl />
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            Menu <span aria-hidden="true">{open ? "−" : "+"}</span>
          </button>
        </div>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          data-open={open}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              document
                .querySelector<HTMLButtonElement>(".menu-toggle")
                ?.focus();
            }
          }}
        >
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
