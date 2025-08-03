// src/pages/Signup.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../services/auth'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { toast } from 'react-toastify'

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                toast.success('Signed up successfully!', {
                    position: 'top-right',
                    autoClose: 3000,
                })
                navigate('/dashboard')
            }
        })
        return () => unsubscribe()
    }, [navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await signup(email, password)
            // Success toast is handled in useEffect after auth state changes
        } catch (err) {
            toast.error(err.message, {
                position: 'top-right',
                autoClose: 5000,
            })
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">EHR System Sign Up</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="text-center text-gray-600 mt-4">
                    Already have an account? <a href="/login" className="text-blue-600 hover:underline">Log In</a>
                </p>
            </div>
        </div>
    )
}