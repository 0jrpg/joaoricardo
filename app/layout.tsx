import "./globals.css";

export const metadata = {
  title: "cdn.files.joaoricardo.space",
  description: "cdn.files.joaoricardo.space",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
