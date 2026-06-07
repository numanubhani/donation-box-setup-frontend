import type { Metadata } from "next";
import "./globals.css";
import Toast from "@/components/shared/Toast";
import SplashScreen from "@/components/shared/SplashScreen";

export const metadata: Metadata = {
  title: "Al-Najaat Box Collection System",
  description: "ANSCF NGO donation box collection and monitoring system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#065f46" />
      </head>
      <body className="bg-white text-slate-700 font-dm antialiased">
        <SplashScreen />
        {children}
        <Toast />
      </body>
    </html>
  );
}
