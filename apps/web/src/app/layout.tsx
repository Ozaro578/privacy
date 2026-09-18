import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FahrPilot", template: "%s · FahrPilot" },
  description: "Die digitale Fahrschulplattform: Theorie lernen, Fahrstunden buchen, Prüfungsreife im Blick.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#1d4ed8", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
