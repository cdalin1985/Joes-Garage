import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joe's Garage — Shop Management",
  description:
    "Customers, vehicles, estimates, invoices, work orders, and accounting for Joe's Garage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
