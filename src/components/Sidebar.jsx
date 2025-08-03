// src/components/Sidebar.jsx
import { useAuth } from '../hooks/useAuth'
import { NavLink } from 'react-router-dom'
import { logout } from '../services/auth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
    HomeIcon,
    UserIcon,
    UserPlusIcon,
    MagnifyingGlassIcon,
    UsersIcon,
    ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'

export default function Sidebar() {
    const { user, role } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await logout()
            toast.success('Logged out successfully!', { position: 'top-right', autoClose: 3000 })
            navigate('/login')
        } catch (error) {
            toast.error(error.message, { position: 'top-right', autoClose: 5000 })
        }
    }

    return (
        <div className="w-64 bg-blue-800 text-white h-screen fixed top-0 left-0 flex flex-col">
            <div className="p-4 text-2xl font-bold border-b border-blue-700">
                EHR System
            </div>
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {user && (
                        <>
                            <li>
                                <NavLink
                                    to="/dashboard"
                                    className={({ isActive }) =>
                                        isActive
                                            ? 'flex items-center p-3 rounded-lg bg-blue-600'
                                            : 'flex items-center p-3 rounded-lg hover:bg-blue-700 transition'
                                    }
                                >
                                    <HomeIcon className="w-6 h-6 mr-2" />
                                    Dashboard
                                </NavLink>
                            </li>
                            {role === 'Patient' && (
                                <li>
                                    <NavLink
                                        to={`/patients/${user.uid}`}
                                        className={({ isActive }) =>
                                            isActive
                                                ? 'flex items-center p-3 rounded-lg bg-blue-600'
                                                : 'flex items-center p-3 rounded-lg hover:bg-blue-700 transition'
                                        }
                                    >
                                        <UserIcon className="w-6 h-6 mr-2" />
                                        My Profile
                                    </NavLink>
                                </li>
                            )}
                            {role === 'Healthcare Worker' && (
                                <>
                                    <li>
                                        <NavLink
                                            to="/patients/register"
                                            className={({ isActive }) =>
                                                isActive
                                                    ? 'flex items-center p-3 rounded-lg bg-blue-600'
                                                    : 'flex items-center p-3 rounded-lg hover:bg-blue-700 transition'
                                            }
                                        >
                                            <UserPlusIcon className="w-6 h-6 mr-2" />
                                            Register Patient
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/patients/search"
                                            className={({ isActive }) =>
                                                isActive
                                                    ? 'flex items-center p-3 rounded-lg bg-blue-600'
                                                    : 'flex items-center p-3 rounded-lg hover:bg-blue-700 transition'
                                            }
                                        >
                                            {/* <MagnifyingGlassIcon className="w-6 h-6 mr-2" /> */}
                                            <UsersIcon className="w-6 h-6 mr-2" />
                                            Manage Patients
                                        </NavLink>
                                    </li>
                                </>
                            )}
                            {role === 'Admin' && (
                                <>
                                    <li>
                                        <NavLink
                                            to="/admin/users"
                                            className={({ isActive }) =>
                                                isActive
                                                    ? 'flex items-center p-3 rounded-lg bg-blue-600'
                                                    : 'flex items-center p-3 rounded-lg hover:bg-blue-700 transition'
                                            }
                                        >
                                            <UsersIcon className="w-6 h-6 mr-2" />
                                            Manage Users
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/patients/search"
                                            className={({ isActive }) =>
                                                isActive
                                                    ? 'flex items-center p-3 rounded-lg bg-blue-600'
                                                    : 'flex items-center p-3 rounded-lg hover:bg-blue-700 transition'
                                            }
                                        >
                                            <MagnifyingGlassIcon className="w-6 h-6 mr-2" />
                                            View Patients
                                        </NavLink>
                                    </li>
                                </>
                            )}
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full text-left p-3 rounded-lg hover:bg-blue-700 transition"
                                >
                                    <ArrowRightStartOnRectangleIcon className="w-6 h-6 mr-2" />
                                    Log Out
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </div>
    )
}