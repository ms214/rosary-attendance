import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "묵주기도 성월 출석체크",
  description: "중고등부 주일학교 묵주기도 성월 매일 출석체크",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6b4fbb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <div className="app-shell">
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
