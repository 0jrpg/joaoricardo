import "./globals.css";

export const metadata = {
  title: "PDF Reader",
  description: "Leitor de PDFs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
