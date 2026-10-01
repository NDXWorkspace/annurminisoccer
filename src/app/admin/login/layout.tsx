export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="surface-admin min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
