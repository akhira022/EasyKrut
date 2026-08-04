import type { Metadata } from "next";
import { Kanit, Sarabun } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "EasyKrut — ระบบสร้างเอกสารราชการ",
  description: "สร้างหนังสือราชการอิเล็กทรอนิกส์สำหรับหน่วยงาน",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${kanit.variable} ${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
