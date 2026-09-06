import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Sidebar } from "@/components/pwa/sidebar";
import { BottomNav } from "@/components/pwa/bottom-nav";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Copiloto Financiero · Rideshare",
  description: "Captura viajes, audita peajes E-ZPass y reconcilia tus ingresos de Uber/Lyft para maximizar deducciones fiscales.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Copiloto",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-900 text-slate-50 font-sans antialiased overflow-x-hidden">
        <div className="fixed inset-0 -z-10 bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 opacity-90" />
        </div>
        <Sidebar />
        <div className="relative mx-auto flex min-h-screen flex-col lg:pl-64">
          <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
            {children}
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
