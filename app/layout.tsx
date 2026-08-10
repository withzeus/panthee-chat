import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panthee",
  description: "Chat with a Burmese-fine-tuned DeepSeek-R1-Distill-Qwen-32B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
