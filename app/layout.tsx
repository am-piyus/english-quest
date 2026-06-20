import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "English Quest — Learn English, one quest a day",
  description:
    "An interactive, gamified English learning platform. Turn daily lessons into quests with instant feedback, stars, and progress tracking.",
};

// Applies the saved (or OS-preferred) theme class before first paint so there
// is no light-flash and no hydration mismatch on a static export. Keep in sync
// with lib/theme.ts (key "eq:theme", class "dark").
const themeScript = `(function(){try{var k="eq:theme",v=localStorage.getItem(k),d=v?v==="dark":matchMedia("(prefers-color-scheme:dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
