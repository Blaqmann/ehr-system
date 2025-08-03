// src/pages/PatientRegistration.jsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { registerPatient } from '../services/auth'
import { toast } from 'react-toastify'

export default function PatientRegistration() {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        medicalHistory: ''
    })
    const [errors, setErrors] = useState({})

    const validateForm = () => {
        const newErrors = {}
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.'
        if (!formData.dob.match(/^\d{4}-\d{2}-\d{2}$/)) newErrors.dob = 'Date of birth must be in YYYY-MM-DD format.'
        if (!['Male', 'Female', 'Other'].includes(formData.gender)) newErrors.gender = 'Please select a valid gender.'
        if (!formData.phone.match(/^\+?\d{10,15}$/)) newErrors.phone = 'Please enter a valid phone number.'
        if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Please enter a valid email.'
        if (!formData.address.trim()) newErrors.address = 'Address is required.'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) {
            toast.error('Please fix the form errors.', { position: 'top-right', autoClose: 5000 })
            return
        }
        try {
            await registerPatient(
                {
                    fullName: formData.fullName,
                    dob: formData.dob,
                    gender: formData.gender,
                    contact: { phone: formData.phone, email: formData.email },
                    address: formData.address,
                    medicalHistory: formData.medicalHistory
                },
                user.uid
            )
            toast.success('Patient registered successfully!', { position: 'top-right', autoClose: 3000 })
            setFormData({ fullName: '', dob: '', gender: '', phone: '', email: '', address: '', medicalHistory: '' })
        } catch (error) {
            toast.error(error.message, { position: 'top-right', autoClose: 5000 })
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setErrors({ ...errors, [e.target.name]: '' })
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-blue-600 mb-6">Register Patient</h1>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                        <label htmlFor="fullName" className="block text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.fullName ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="dob" className="block text-gray-700 mb-2">Date of Birth (YYYY-MM-DD)</label>
                        <input
                            type="text"
                            id="dob"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.dob ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="gender" className="block text-gray-700 mb-2">Gender</label>
                        <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.gender ? 'border-red-500' : ''}`}
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="phone" className="block text-gray-700 mb-2">Phone Number</label>
                        <input
                            type="text"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.phone ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 mb-2">Email (Optional)</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="address" className="block text-gray-700 mb-2">Address</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.address ? 'border-red-500' : ''}`}
                            required
                        />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>
                </div>
                <div className="mb-4">
                    <label htmlFor="medicalHistory" className="block text-gray-700 mb-2">Medical History</label>
                    <textarea
                        id="medicalHistory"
                        name="medicalHistory"
                        value={formData.medicalHistory}
                        onChange={handleChange}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        rows="4"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Register Patient
                </button>
            </form>
        </div>
    )
}