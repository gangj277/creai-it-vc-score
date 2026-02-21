import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI VC 투자 심사 | CREAI+IT",
  description:
    "스타트업 아이디어 한 줄이면 충분합니다. AI VC가 즉시 투자 심사를 진행합니다. CREAI+IT 연세대 AI 창업 학회.",
  keywords: ["스타트업", "아이디어 검증", "AI VC", "투자 심사", "창업", "CREAI+IT", "연세대학교"],
  authors: [{ name: "CREAI+IT" }],
  openGraph: {
    title: "AI VC 투자 심사 | CREAI+IT",
    description: "아이디어 한 줄로 AI VC 투자 심사를 받아보세요",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e1a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <div className="app-shell">
          <header className="topbar">
            <Link href="/" className="brand" aria-label="AI VC 심사 홈으로 이동">
              CREAI+IT
            </Link>
            <nav aria-label="주요 메뉴">
              <Link href="/leaderboard" className="nav-link">리더보드</Link>
              <span className="nav-badge">AI VC</span>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
