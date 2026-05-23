import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "OutbreakOS — AI-powered outbreak operations command center",
  description:
    "OutbreakOS is the outbreak intelligence, screening workflow, contact monitoring, logistics, and executive reporting platform for airports, mining operations, hospitals, NGOs, and government response teams.",
  metadataBase: new URL("https://outbreakos.example.com"),
  openGraph: {
    title: "OutbreakOS",
    description:
      "Real-time outbreak operations: screening, contact monitoring, logistics, AI briefings.",
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
