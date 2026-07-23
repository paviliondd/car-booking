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
  keywords: "thuê xe tự lái La Gi, thuê xe Bình Thuận, đặt xe online, quản lý xe tự lái, datxe",
  metadataBase: new URL("https://datxe.linuxunity.com"),
  openGraph: {
    title: "datxe - Thuê xe tự lái minh bạch, nhanh chóng",
    description: "Tìm xe, đặt lịch và quản lý hành trình trên một nền tảng đáng tin cậy.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a href="#main-content" className="skip-link">Bỏ qua đến nội dung chính</a>
        <ThemeProvider>
          <ToastProvider>
            <QueryProvider>
              <div id="main-content" className="contents">{children}</div>
            </QueryProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
