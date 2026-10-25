import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import { EvaluationTimingProvider } from "@/components/evaluation-timing";
import "./globals.css";
import "./experience.css";

export const metadata: Metadata = {
  title: "Quiet Chess | Is Your Piece Safe?",
  description:
    "A patient, interactive chess lesson. Learn to notice threats, check your moves, and keep your pieces safe.",
  applicationName: "Quiet Chess",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Quiet Chess",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#101d17" },
  ],
};
const themeInitialization = `(function(){try{var p=localStorage.getItem('quiet-chess:theme:v1');document.documentElement.dataset.theme=p==='dark'||p==='light'?p:'system';}catch(e){document.documentElement.dataset.theme='system';}})();`;
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="theme-initialization"
          dangerouslySetInnerHTML={{ __html: themeInitialization }}
        />
      </head>
      <body>
        <EvaluationTimingProvider>
          <a className="skip-link" href="#main">
            Skip to main content
          </a>
          <SiteHeader />
          {children}
          <noscript>
            <p className="shell">
              This interactive lesson needs JavaScript to validate moves and
              save progress locally.
            </p>
          </noscript>
        </EvaluationTimingProvider>
      </body>
    </html>
  );
}
