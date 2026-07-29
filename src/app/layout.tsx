import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cinzel",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-body",
});

export const metadata: Metadata = {
  title: "Myxveil",
  description: "Fichas de personagem, mapa de relações e wiki de lore do RPG Myxveil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`h-full antialiased ${cinzel.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
