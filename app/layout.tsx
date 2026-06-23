import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { InstallHint } from "./components/InstallHint";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Games",
  description: "Play World Cup minigames, chase high scores, and challenge friends.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "World Cup Games",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16a34a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full w-full max-w-full overflow-x-hidden antialiased"
    >
      <body className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden">
        {children}
        <InstallHint />
        <Analytics />
      </body>
    </html>
  );
}
