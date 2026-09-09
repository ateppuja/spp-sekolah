import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "White Bee School of Life — Sistem Pembayaran SPP",
  description: "Aplikasi pengelolaan tagihan SPP dan pembayaran White Bee School of Life modern, terstruktur, dan responsif.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
