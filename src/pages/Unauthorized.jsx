// src/pages/Unauthorized.jsx
export default function Unauthorized() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h1>
                <p className="text-gray-700">You do not have permission to access this page.</p>
                <a href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Go to Dashboard</a>
            </div>
        </div>
    )
}