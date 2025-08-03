// src/pages/PatientSearch.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPatients } from '../services/auth'
import { toast } from 'react-toastify'
import ReactPaginate from 'react-paginate'

export default function PatientSearch() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [currentPage, setCurrentPage] = useState(0)
    const patientsPerPage = 10

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const patientList = await getPatients()
                setPatients(patientList)
                setLoading(false)
            } catch (error) {
                toast.error(error.message, { position: 'top-right', autoClose: 5000 })
                setLoading(false)
            }
        }
        fetchPatients()
    }, [])

    const filteredPatients = patients
        .filter(patient =>
            patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient.lastVisit && patient.lastVisit.includes(searchTerm))
        )
        .sort((a, b) => {
            if (sortBy === 'name') return a.fullName.localeCompare(b.fullName)
            if (sortBy === 'lastVisit') {
                return (b.lastVisit || '').localeCompare(a.lastVisit || '')
            }
            return 0
        })

    const pageCount = Math.ceil(filteredPatients.length / patientsPerPage)
    const offset = currentPage * patientsPerPage
    const currentPatients = filteredPatients.slice(offset, offset + patientsPerPage)

    const handlePageClick = ({ selected }) => {
        setCurrentPage(selected)
    }

    if (loading) {
        return <div className="flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-blue-600 mb-6">Patient Search</h1>
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by name or visit date"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                    <option value="name">Sort by Name</option>
                    <option value="lastVisit">Sort by Last Visit</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-blue-100">
                            <th className="px-4 py-2 text-left text-gray-700">Full Name</th>
                            <th className="px-4 py-2 text-left text-gray-700">DOB</th>
                            <th className="px-4 py-2 text-left text-gray-700">Gender</th>
                            <th className="px-4 py-2 text-left text-gray-700">Last Visit</th>
                            <th className="px-4 py-2 text-left text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentPatients.map(patient => (
                            <tr key={patient.id} className="border-b">
                                <td className="px-4 py-2">{patient.fullName}</td>
                                <td className="px-4 py-2">{patient.dob}</td>
                                <td className="px-4 py-2">{patient.gender}</td>
                                <td className="px-4 py-2">{patient.lastVisit || 'N/A'}</td>
                                <td className="px-4 py-2">
                                    <Link
                                        to={`/patients/${patient.id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ReactPaginate
                previousLabel="Previous"
                nextLabel="Next"
                pageCount={pageCount}
                onPageChange={handlePageClick}
                containerClassName="react-paginate"
                activeClassName="active"
                disabledClassName="disabled"
            />
        </div>
    )
}