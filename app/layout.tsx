import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import ResponsiveDeviceShell from "@/components/ResponsiveDeviceShell";
import { Sidebar } from "@/components/pwa/sidebar";

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
      <body className="min-h-screen bg-[#0F172A] text-[#F8FAFC] font-sans antialiased overflow-x-hidden">
        <Sidebar />
        <main className="md:ml-64 min-h-screen pb-[env(safe-area-inset-bottom)]">
          {children}
        </main>
      </body>
    </html>
  );
}
