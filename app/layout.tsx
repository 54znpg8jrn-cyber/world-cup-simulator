import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Simulator",
  description: "Choose a nation, build your XI, and simulate the tournament.",
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
      </body>
    </html>
  );
}
