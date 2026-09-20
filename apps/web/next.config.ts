import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-Server auch über 127.0.0.1 nutzbar (E2E-Tests, Vorschau-Screenshots); sonst wird die Hydration blockiert.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
