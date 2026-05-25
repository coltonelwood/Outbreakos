import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "OutbreakOS — Operational health-security infrastructure",
  description:
    "OutbreakOS is the operational health-security platform for mining, industrial, airport, hospital, NGO, and government teams running screening, contact monitoring, logistics, and executive reporting in high-risk environments.",
  metadataBase: new URL("https://outbreakos.example.com"),
  openGraph: {
    title: "OutbreakOS",
    description:
      "Operational health-security for high-risk workforces — screening, contact monitoring, logistics, AI briefings.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1.5 focus:rounded-md"
        >
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
