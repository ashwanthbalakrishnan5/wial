export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at center, oklch(0.53 0.09 210 / 0.04) 0%, transparent 70%), var(--color-background)",
      }}
    >
      {children}
    </div>
  );
}
