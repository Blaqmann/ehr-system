// src/components/Layout.jsx
import Sidebar from './Sidebar'

export default function Layout({ children }) {
    return (
        <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-6 bg-gray-100 min-h-screen">
                {children}
            </main>
        </div>
    )
}