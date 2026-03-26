import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebEOC View Builder",
  description: "Visually design forms, views, and dashboards with a drag-and-drop interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}
