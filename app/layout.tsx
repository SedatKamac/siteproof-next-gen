import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siteproof — Code-first website audits",
  description: "Professional technical and commercial website audits for web agencies.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
