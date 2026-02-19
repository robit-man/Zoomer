import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoomer Consulting",
  description: "Zoomer consulting studio site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
