import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiet Chess | Is Your Piece Safe?",
  description:
    "A patient, interactive chess lesson. Learn to notice threats, check your moves, and keep your pieces safe.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to lesson
        </a>
        <SiteHeader />
        {children}
        <noscript>
          <p className="shell">
            This interactive lesson needs JavaScript to validate moves and save
            progress locally.
          </p>
        </noscript>
      </body>
    </html>
  );
}
