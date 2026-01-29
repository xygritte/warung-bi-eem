import "./globals.css";

export const metadata = {
  title: "Warung Bi Eem",
  description: "Website pemesanan makanan",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}