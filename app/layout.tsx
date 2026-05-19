import type { Metadata } from "next";
import { AiAssistantFab } from "@/components/ai-assistant-fab";
import { AppFooter } from "@/components/app-footer";
import ClickSpark from "@/components/click-spark";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"),
  title: {
    default: "C-Work — Freelance & ажлын зар",
    template: "%s · C-Work",
  },
  description:
    "Freelancer, компани, ажлын зар. Профайл, өргөдөл, санал — Монголын freelance платформ.",
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: "C-Work",
    title: "C-Work",
    description: "Freelancer болон компанийн холбоос — ажлын зар, профайл.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" data-scroll-behavior="smooth">
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="siteRoot">
          <div className="siteMain">
            <ClickSpark sparkColor="rgba(124, 58, 237, 0.85)" sparkCount={10} sparkRadius={18} sparkSize={11} duration={400}>
              {children}
            </ClickSpark>
          </div>
          <AppFooter />
        </div>
        <AiAssistantFab />
      </body>
    </html>
  );
}
