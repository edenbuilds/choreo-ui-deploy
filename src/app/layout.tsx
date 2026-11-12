import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { copy } from "@/copy";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = { title: copy.meta.title, description: copy.meta.description };

// Runs before paint so a saved light theme does not flash dark. Dark is the default.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem("theme")==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
