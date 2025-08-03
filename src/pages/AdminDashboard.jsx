// src/pages/AdminDashboard.jsx
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-blue-600 mb-4">Admin Dashboard</h1>
            <p className="text-gray-700 mb-4">This is an Admin-only page.</p>
            <Link
                to="/admin/users"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
                Manage Users
            </Link>
        </div>
    )
}