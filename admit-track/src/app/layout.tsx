import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "admitus - Student Admission Manager",
  description: "Search programs, track deadlines, manage documents, and get admitted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
