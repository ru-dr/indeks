import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ToastProvider } from "@/components/ui/toast";

import { ThemeProvider } from "@/components/providers/theme-provider";

import IndeksProvider from "@/components/providers/indeks-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INDEKS",
  description: "indeks Every Click, Every View",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <ToastProvider>
          <ThemeProvider
            attribute="class"
            enableColorScheme
            defaultTheme="dark"
          >
            <IndeksProvider />
            {children}
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
