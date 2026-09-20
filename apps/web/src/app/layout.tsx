import type { Metadata, Viewport } from "next";
import "./globals.css";
import { appearanceAttributes, getAppearance } from "@/lib/appearance";

export const metadata: Metadata = {
  title: { default: "FahrPilot", template: "%s · FahrPilot" },
  description: "Die digitale Fahrschulplattform: Theorie lernen, Fahrstunden buchen, Prüfungsreife im Blick.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#1d4ed8", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const attrs = appearanceAttributes(await getAppearance());
  return (
    <html lang="de" {...attrs} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
