export const metadata = {
  title: 'StefanOS V2',
  description: 'Real-time Personal Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}