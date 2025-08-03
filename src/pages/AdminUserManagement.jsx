// src/pages/AdminUserManagement.jsx
import { useState, useEffect } from 'react'
import { getAllUsers, updateUserRole } from '../services/auth'
import { toast } from 'react-toastify'

export default function AdminUserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const userList = await getAllUsers()
                setUsers(userList)
                setLoading(false)
            } catch (err) {
                toast.error(err.message, {
                    position: 'top-right',
                    autoClose: 5000,
                })
                setLoading(false)
            }
        }
        fetchUsers()
    }, [])

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateUserRole(userId, newRole)
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ))
            toast.success(`Role updated to ${newRole} successfully!`, {
                position: 'top-right',
                autoClose: 3000,
            })
        } catch (err) {
            toast.error(err.message, {
                position: 'top-right',
                autoClose: 5000,
            })
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-blue-600 mb-6">User Management</h1>
            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-blue-100">
                            <th className="px-4 py-2 text-left text-gray-700">Email</th>
                            <th className="px-4 py-2 text-left text-gray-700">Current Role</th>
                            <th className="px-4 py-2 text-left text-gray-700">Change Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b">
                                <td className="px-4 py-2">{user.email}</td>
                                <td className="px-4 py-2">{user.role}</td>
                                <td className="px-4 py-2">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    >
                                        {/* <option value="Patient">Patient</option> */}
                                        <option value="Healthcare Worker">Healthcare Worker</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}