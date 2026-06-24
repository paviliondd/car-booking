import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "datxe - Hệ thống thuê xe tự lái thông minh",
  description: "Dịch vụ thuê xe tự lái nhanh chóng. Đặt xe trực tuyến, quản lý lịch trình, hợp đồng và thanh toán tiện lợi qua MoMo/VietQR.",
  keywords: "thuê xe tự lái, đặt xe online, quản lý xe tự lái, xe tự lái Hà Nội, xe tự lái HCM, datxe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0f19] dark:bg-[#0b0f19] light:bg-[#f9fafb] text-[#f3f4f6] dark:text-[#f3f4f6] light:text-[#111827] transition-colors duration-300">
        <ThemeProvider>
          <ToastProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
