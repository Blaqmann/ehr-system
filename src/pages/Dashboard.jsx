// src/pages/Dashboard.jsx
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import { getPatients, getPatientVisits, getImmunizations, getReferrals } from '../services/auth'
import * as XLSX from 'xlsx'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

// Skeleton Loader Components
const ChartSkeleton = ({ height = 300 }) => (
    <div className={`animate-pulse bg-gray-200 rounded h-[${height}px] w-full`}></div>
)

const ButtonSkeleton = () => (
    <div className="animate-pulse bg-gray-200 rounded h-10 w-full"></div>
)

export default function Dashboard() {
    const { user, role, loading: authLoading } = useAuth()
    const [analyticsData, setAnalyticsData] = useState({
        visits: [],
        immunizations: [],
        referrals: [],
        patients: [],
    })
    const [loading, setLoading] = useState({
        visits: true,
        immunizations: true,
        referrals: true,
        patients: true,
        reports: true
    })

    useEffect(() => {
        if (user && role) {
            loadAnalyticsData()
        }
    }, [user, role])

    const loadAnalyticsData = async () => {
        try {
            setLoading({
                visits: true,
                immunizations: true,
                referrals: true,
                patients: true,
                reports: true
            })

            // Get all patients first
            const patientsSnapshot = await getPatients()
            const patients = patientsSnapshot.map(p => ({ id: p.id, ...p }))
            setAnalyticsData(prev => ({ ...prev, patients }))
            setLoading(prev => ({ ...prev, patients: false }))

            // Get all related data for each patient
            const [visitsData, immunizationsData, referralsData] = await Promise.all([
                Promise.all(patients.map(patient => getPatientVisits(patient.id))),
                Promise.all(patients.map(patient => getImmunizations(patient.id))),
                Promise.all(patients.map(patient => getReferrals(patient.id)))
            ])

            // Process visits data
            const allVisits = visitsData.flat()
            const visitCounts = allVisits.reduce((acc, visit) => {
                const date = visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : 'Unknown Date'
                acc[date] = (acc[date] || 0) + 1
                return acc
            }, {})
            setAnalyticsData(prev => ({
                ...prev,
                visits: Object.entries(visitCounts).map(([date, count]) => ({ date, count }))
            }))
            setLoading(prev => ({ ...prev, visits: false }))

            // Process immunizations data
            const allImmunizations = immunizationsData.flat()
            const immunizationTypes = allImmunizations.reduce((acc, imm) => {
                const type = imm.vaccineType || 'Unknown Vaccine'
                acc[type] = (acc[type] || 0) + 1
                return acc
            }, {})
            setAnalyticsData(prev => ({
                ...prev,
                immunizations: Object.entries(immunizationTypes).map(([name, value]) => ({ name, value }))
            }))
            setLoading(prev => ({ ...prev, immunizations: false }))

            // Process referrals data
            const allReferrals = referralsData.flat()
            const referralFacilities = allReferrals.reduce((acc, ref) => {
                const facility = ref.facility || 'Unknown Facility'
                acc[facility] = (acc[facility] || 0) + 1
                return acc
            }, {})
            setAnalyticsData(prev => ({
                ...prev,
                referrals: Object.entries(referralFacilities).map(([name, value]) => ({ name, value }))
            }))
            setLoading(prev => ({ ...prev, referrals: false, reports: false }))

        } catch (error) {
            console.error('Error loading analytics data:', error)
            toast.error('Failed to load analytics data: ' + error.message)
            setLoading({
                visits: false,
                immunizations: false,
                referrals: false,
                patients: false,
                reports: false
            })
        }
    }

    const generateReport = (type) => {
        if (loading.reports) return

        let data = []
        let fileName = 'report'

        switch (type) {
            case 'visits':
                data = analyticsData.visits.map(v => ({ date: v.date, visits: v.count }))
                fileName = 'visits_report'
                break
            case 'immunizations':
                data = analyticsData.immunizations.map(i => ({ vaccineType: i.name, count: i.value }))
                fileName = 'immunizations_report'
                break
            case 'referrals':
                data = analyticsData.referrals.map(r => ({ facility: r.name, count: r.value }))
                fileName = 'referrals_report'
                break
            case 'patients':
                data = analyticsData.patients.map(p => ({
                    id: p.id,
                    name: p.name || 'N/A',
                    dob: p.dob || 'N/A',
                    gender: p.gender || 'N/A',
                    createdAt: p.createdAt || 'N/A'
                }))
                fileName = 'patients_report'
                break
            default:
                return
        }

        if (data.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Report")
            XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`)
        } else {
            toast.warning('No data available to generate report', {
                position: 'top-right',
                autoClose: 5000,
            })
        }
    }

    if (authLoading) {
        return (
            <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg space-y-8">
                <div className="animate-pulse bg-gray-200 h-8 w-64 rounded mb-4"></div>
                <div className="animate-pulse bg-gray-200 h-6 w-96 rounded mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map(i => <ButtonSkeleton key={i} />)}
                </div>
                <div className="space-y-12">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-50 p-6 rounded-lg shadow">
                            <div className="animate-pulse bg-gray-200 h-6 w-48 rounded mb-4"></div>
                            <ChartSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (!user || !role) {
        toast.error('Unable to load user data. Please try logging in again.', {
            position: 'top-right',
            autoClose: 5000,
        })
        return <div className="flex items-center justify-center">Error: Unable to load user data</div>
    }

    return (
        <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg space-y-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-4">Welcome to EHR System</h1>
            <p className="text-gray-700 mb-8">Logged in as: {user.email} ({role})</p>

            {/* Report Generation Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {loading.reports ? (
                    [1, 2, 3, 4].map(i => <ButtonSkeleton key={i} />)
                ) : (
                    <>
                        <button
                            onClick={() => generateReport('visits')}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                            disabled={loading.visits}
                        >
                            Download Visits Report
                        </button>
                        <button
                            onClick={() => generateReport('immunizations')}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                            disabled={loading.immunizations}
                        >
                            Download Immunizations Report
                        </button>
                        <button
                            onClick={() => generateReport('referrals')}
                            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                            disabled={loading.referrals}
                        >
                            Download Referrals Report
                        </button>
                        <button
                            onClick={() => generateReport('patients')}
                            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                            disabled={loading.patients}
                        >
                            Download Patients Report
                        </button>
                    </>
                )}
            </div>

            {/* Analytics Dashboards */}
            <div className="space-y-12">
                {/* Visits Chart */}
                <div className="bg-gray-50 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Patient Visits</h2>
                    {loading.visits ? (
                        <ChartSkeleton />
                    ) : (
                        <div className="h-80">
                            <BarChart
                                width={800}
                                height={300}
                                data={analyticsData.visits.slice(-10)}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" name="Visits" />
                            </BarChart>
                        </div>
                    )}
                </div>

                {/* Immunizations Chart */}
                <div className="bg-gray-50 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Immunizations by Type</h2>
                    {loading.immunizations ? (
                        <ChartSkeleton />
                    ) : (
                        <div className="h-80">
                            <PieChart width={800} height={300}>
                                <Pie
                                    data={analyticsData.immunizations}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {analyticsData.immunizations.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </div>
                    )}
                </div>

                {/* Referrals Chart */}
                <div className="bg-gray-50 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Referrals by Facility</h2>
                    {loading.referrals ? (
                        <ChartSkeleton />
                    ) : (
                        <div className="h-80">
                            <BarChart
                                width={800}
                                height={300}
                                data={analyticsData.referrals}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#82ca9d" name="Referrals" />
                            </BarChart>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}