import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NitroCopy",
  description: "Anúncios e VSLs que vendem, gerados pela sua própria fórmula.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
