import type { Metadata } from "next";
import { Inter } from "next/font/google"
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CloudCorrect - Architecture Invariant Monitoring",
  description: "Validate architectural intent in AWS environments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProd = process.env.NODE_ENV === "production";
  console.log("IS PROD:", isProd);

  return (
    <html lang="en">
      <head>
        {isProd && (
          <Script
            src="/env.js"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ConfirmProvider>
            <div className="flex">
              <Sidebar />
              <main className="flex-1 min-h-screen bg-white">
                {children}
                <Toaster position="top-right" />
              </main>
            </div>
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
