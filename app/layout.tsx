import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

// Warm serif for headings, clean sans for body text.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Westward Coffee",
  description: "Westward Coffee: menu, hours and location.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-cream text-espresso">{children}</body>
    </html>
  );
}
