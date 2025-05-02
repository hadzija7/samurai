import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Privy from "../components/Privy";
import { JwtProvider } from "@/contexts/jwt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SamurAI - Blockchain Intelligence",
  description: "Your AI-powered blockchain assistant for seamless transactions",
  icons: {
    icon: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JwtProvider>
          <Privy>{children}</Privy>
        </JwtProvider>
      </body>
    </html>
  );
}
