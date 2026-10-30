import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DiscussionProvider } from "@/features/discussion/DiscussionProvider";

export const metadata: Metadata = {
  title: "Mumken | Community Discussion",
  description: "Explore community updates and share your perspective.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c2933",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <DiscussionProvider>{children}</DiscussionProvider>
      </body>
    </html>
  );
}
