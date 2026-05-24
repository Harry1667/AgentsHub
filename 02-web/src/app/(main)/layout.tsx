import { Sidebar } from "@/components/sidebar"
import { DbLoader } from "@/components/db-loader"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DbLoader />
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
