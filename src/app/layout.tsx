import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { brand } from "@/config/brand";
import { AppStoreProvider } from "@/lib/store/app-store";
import { ToastProvider } from "@/components/ui/toast";
import { ProductDialogProvider } from "@/components/products/product-dialog-provider";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin", "cyrillic"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline.toLowerCase()}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
};

export const viewport: Viewport = {
  themeColor: "#f7f3ea",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${lora.variable}`}
    >
      <body>
        <AppStoreProvider>
          <ToastProvider>
            <ProductDialogProvider>
              <AppShell>{children}</AppShell>
            </ProductDialogProvider>
          </ToastProvider>
        </AppStoreProvider>
      </body>
    </html>
  );
}
