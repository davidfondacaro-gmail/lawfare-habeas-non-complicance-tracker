import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "Government Contempt & Non-Compliance Tracker",
  description:
    "Tracking instances where federal courts have found or threatened contempt, sanctions, or other remedial action against the government for non-compliance with court orders in immigration and habeas corpus cases.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
