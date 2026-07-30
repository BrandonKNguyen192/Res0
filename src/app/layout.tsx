import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth0";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Res0",
  description:
    "Multi-venue hospitality SaaS where identity and billing share one boundary.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="wordmark">
            Res0
          </Link>
          <nav>
            {session ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <a href="/auth/logout">Sign out</a>
              </>
            ) : appConfig.auth0Configured ? (
              <a href="/auth/login" className="button">
                Sign in
              </a>
            ) : (
              <span className="badge off">auth not configured</span>
            )}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
