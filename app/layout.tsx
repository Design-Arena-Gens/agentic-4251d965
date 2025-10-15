import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShaadiFrame AI",
  description:
    "Telegram AI bot that transforms personal photos into Indian wedding portfolio shots."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div>{children}</div>
      </body>
    </html>
  );
}
