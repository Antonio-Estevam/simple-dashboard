import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils"
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coachin OS | Login",
  description: "Faça o login para ter acesso ao Coachin OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        {/* aqui tinha a sidebar, mas como é a página de login, não faz sentido ter a sidebar aqui, então eu comentei ela por enquanto */}
        {children}</body>
    </html>
  );
}
