import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DATXE - Hệ Thống Cho Thuê & Quản Lý Xe Tự Lái Thông Minh",
  description: "Dịch vụ thuê xe tự lái nhanh chóng qua mã QR. Đặt xe trực tuyến, quản lý lịch trình tự động chống trùng lặp, thanh toán tiện lợi qua MoMo/VietQR.",
  keywords: "thuê xe tự lái, đặt xe online, quản lý xe tự lái, xe tự lái Hà Nội, xe tự lái HCM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0f19] text-[#f3f4f6]">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
