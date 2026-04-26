import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-800 flex items-center justify-end px-6 bg-gray-950 flex-shrink-0">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
