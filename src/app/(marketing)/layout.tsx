export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>{/* marketing nav */}</nav>
      <main>{children}</main>
      <footer>{/* marketing footer */}</footer>
    </div>
  );
}
