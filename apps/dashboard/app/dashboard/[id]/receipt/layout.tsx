export default function ReceiptLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Minimal layout for receipt printing — no sidebar, no header
    return <>{children}</>;
}
