// src/pages/PatientProfile.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getPatientById, getPatientVisits, addPatientVisit, getImmunizations, addImmunization, getReferrals, addReferral, syncOfflineData } from '../services/auth';
import { toast } from 'react-toastify';
import { DocumentTextIcon, ArrowRightCircleIcon, WifiIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { FaSyringe } from 'react-icons/fa';
import { checkAlerts, showOnscreenNotification } from '../services/notifications';

export default function PatientProfile() {
    const { patientId } = useParams();
    const { role } = useAuth();
    const [patient, setPatient] = useState(null);
    const [visits, setVisits] = useState([]);
    const [immunizations, setImmunizations] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visitForm, setVisitForm] = useState({ date: '', symptoms: '', diagnoses: '', treatments: '', notes: '' });
    const [immunizationForm, setImmunizationForm] = useState({ vaccineType: '', dose: '', dateAdministered: '', nextDueDate: '' });
    const [referralForm, setReferralForm] = useState({ facility: '', reason: '', notes: '', referralDate: '' });
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('visit');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const patientData = await getPatientById(patientId).catch((err) => {
                    console.error('getPatientById error:', err.message);
                    throw err;
                });
                setPatient(patientData);

                const visitData = await getPatientVisits(patientId).catch((err) => {
                    console.error('getPatientVisits error:', err.message);
                    throw err;
                });
                setVisits(visitData);

                const immunizationData = await getImmunizations(patientId).catch((err) => {
                    console.error('getImmunizations error:', err.message);
                    throw err;
                });
                setImmunizations(immunizationData);

                const referralData = await getReferrals(patientId).catch((err) => {
                    console.error('getReferrals error:', err.message);
                    throw err;
                });
                setReferrals(referralData);
                setLoading(false);

                // Calculate pending sync count
                const offlineDocs = visitData.filter((doc) => doc.offline).length + immunizationData.filter((doc) => doc.offline).length + referralData.filter((doc) => doc.offline).length;
                setPendingSyncCount(offlineDocs);

                // Check and display alerts on initial load
                checkAndDisplayAlerts(immunizationData);
            } catch (error) {
                console.error('Fetch error:', error.message);
                toast.error(error.message, { position: 'top-right', autoClose: 5000 });
                setLoading(false);
            }
        };

        fetchPatientData();

        const handleOnline = async () => {
            setIsOnline(true);
            try {
                const count = await syncOfflineData();
                if (count > 0) {
                    toast.success(`${count} record(s) synced successfully!`, { position: 'top-right', autoClose: 3000 });
                    fetchPatientData(); // Refresh data after sync
                }
            } catch (error) {
                toast.error(error.message, { position: 'top-right', autoClose: 5000 });
            }
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [patientId]);

    const checkAndDisplayAlerts = (immunizationData) => {
        const alerts = checkAlerts(immunizationData);
        alerts.forEach((alert) => {
            showOnscreenNotification(alert.message, alert.key);
        });
    };

    const validateVisitForm = () => {
        const newErrors = {};
        if (!visitForm.date.match(/^\d{4}-\d{2}-\d{2}$/)) newErrors.date = 'Date must be in YYYY-MM-DD format.';
        if (!visitForm.symptoms.trim()) newErrors.symptoms = 'Symptoms are required.';
        if (!visitForm.diagnoses.trim()) newErrors.diagnoses = 'Diagnoses are required.';
        if (!visitForm.treatments.trim()) newErrors.treatments = 'Treatments are required.';
        if (!visitForm.notes.trim()) newErrors.notes = 'Notes are required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateImmunizationForm = () => {
        const newErrors = {};
        if (!immunizationForm.vaccineType.trim()) newErrors.vaccineType = 'Vaccine type is required.';
        if (!immunizationForm.dose || immunizationForm.dose < 1) newErrors.dose = 'Dose must be a positive number.';
        if (!immunizationForm.dateAdministered.match(/^\d{4}-\d{2}-\d{2}$/)) newErrors.dateAdministered = 'Date must be in YYYY-MM-DD format.';
        if (immunizationForm.nextDueDate && !immunizationForm.nextDueDate.match(/^\d{4}-\d{2}-\d{2}$/)) newErrors.nextDueDate = 'Next due date must be in YYYY-MM-DD format.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateReferralForm = () => {
        const newErrors = {};
        if (!referralForm.facility.trim()) newErrors.facility = 'Facility is required.';
        if (!referralForm.reason.trim()) newErrors.reason = 'Reason is required.';
        if (!referralForm.notes.trim()) newErrors.notes = 'Notes are required.';
        if (!referralForm.referralDate.match(/^\d{4}-\d{2}-\d{2}$/)) newErrors.referralDate = 'Referral date must be in YYYY-MM-DD format.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleVisitSubmit = async (e) => {
        e.preventDefault();
        if (!validateVisitForm()) {
            toast.error('Please fix the form errors.', { position: 'top-right', autoClose: 5000 });
            return;
        }
        setIsSubmitting(true);
        try {
            await addPatientVisit(patientId, visitForm);
            const updatedVisits = await getPatientVisits(patientId);
            setVisits(updatedVisits);
            setVisitForm({ date: '', symptoms: '', diagnoses: '', treatments: '', notes: '' });
            toast.success(isOnline ? 'Visit added successfully!' : 'Visit saved offline!', { position: 'top-right', autoClose: 3000 });
            setPendingSyncCount((prev) => (isOnline ? prev : prev + 1));
        } catch (error) {
            toast.error(error.message, { position: 'top-right', autoClose: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImmunizationSubmit = async (e) => {
        e.preventDefault();
        if (!validateImmunizationForm()) {
            toast.error('Please fix the form errors.', { position: 'top-right', autoClose: 5000 });
            return;
        }
        setIsSubmitting(true);
        try {
            await addImmunization(patientId, {
                vaccineType: immunizationForm.vaccineType,
                dose: parseInt(immunizationForm.dose),
                dateAdministered: immunizationForm.dateAdministered,
                nextDueDate: immunizationForm.nextDueDate || null,
            });
            const updatedImmunizations = await getImmunizations(patientId);
            setImmunizations(updatedImmunizations);
            setImmunizationForm({ vaccineType: '', dose: '', dateAdministered: '', nextDueDate: '' });
            toast.success(isOnline ? 'Immunization added successfully!' : 'Immunization saved offline!', { position: 'top-right', autoClose: 3000 });
            setPendingSyncCount((prev) => (isOnline ? prev : prev + 1));

            // Check and display alerts after adding a new immunization
            checkAndDisplayAlerts(updatedImmunizations);
        } catch (error) {
            toast.error(error.message, { position: 'top-right', autoClose: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReferralSubmit = async (e) => {
        e.preventDefault();
        if (!validateReferralForm()) {
            toast.error('Please fix the form errors.', { position: 'top-right', autoClose: 5000 });
            return;
        }
        setIsSubmitting(true);
        try {
            await addReferral(patientId, {
                facility: referralForm.facility,
                reason: referralForm.reason,
                notes: referralForm.notes,
                referralDate: referralForm.referralDate,
            });
            const updatedReferrals = await getReferrals(patientId);
            setReferrals(updatedReferrals);
            setReferralForm({ facility: '', reason: '', notes: '', referralDate: '' });
            toast.success(isOnline ? 'Referral added successfully!' : 'Referral saved offline!', { position: 'top-right', autoClose: 3000 });
            setPendingSyncCount((prev) => (isOnline ? prev : prev + 1));
        } catch (error) {
            toast.error(error.message, { position: 'top-right', autoClose: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormChange = (e, formType) => {
        const { name, value } = e.target;
        if (formType === 'visit') {
            setVisitForm({ ...visitForm, [name]: value });
            setErrors({ ...errors, [name]: '' });
        } else if (formType === 'immunization') {
            setImmunizationForm({ ...immunizationForm, [name]: value });
            setErrors({ ...errors, [name]: '' });
        } else if (formType === 'referral') {
            setReferralForm({ ...referralForm, [name]: value });
            setErrors({ ...errors, [name]: '' });
        }
    };

    const isOverdue = (nextDueDate) => {
        if (!nextDueDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return nextDueDate < today;
    };

    const handleManualSync = async () => {
        try {
            const count = await syncOfflineData();
            if (count > 0) {
                toast.success(`${count} record(s) synced successfully!`, { position: 'top-right', autoClose: 3000 });
                // Refresh data
                const [visitData, immunizationData, referralData] = await Promise.all([
                    getPatientVisits(patientId),
                    getImmunizations(patientId),
                    getReferrals(patientId),
                ]);
                setVisits(visitData);
                setImmunizations(immunizationData);
                setReferrals(referralData);
                setPendingSyncCount(0);

                // Check alerts after sync
                checkAndDisplayAlerts(immunizationData);
            } else {
                toast.info('No records to sync', { position: 'top-right', autoClose: 3000 });
            }
        } catch (error) {
            console.error('Sync failed:', error);
            toast.error(`Sync failed: ${error.message}`, { position: 'top-right', autoClose: 5000 });
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center">Loading...</div>;
    }

    if (!patient) {
        return <div className="flex items-center justify-center">Patient not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-blue-600">Patient Profile</h1>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <WifiIcon className={`w-5 h-5 mr-2 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    {pendingSyncCount > 0 && (
                        <button
                            onClick={handleManualSync}
                            className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                        >
                            <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                            Sync {pendingSyncCount} Record(s)
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <p>
                        <strong>Full Name:</strong> {patient.fullName}
                    </p>
                    <p>
                        <strong>Date of Birth:</strong> {patient.dob}
                    </p>
                    <p>
                        <strong>Gender:</strong> {patient.gender}
                    </p>
                </div>
                <div>
                    <p>
                        <strong>Phone:</strong> {patient.contact.phone}
                    </p>
                    <p>
                        <strong>Email:</strong> {patient.contact.email || 'N/A'}
                    </p>
                    <p>
                        <strong>Address:</strong> {patient.address}
                    </p>
                </div>
            </div>
            <div className="mb-6">
                <p>
                    <strong>Medical History:</strong>
                </p>
                <p className="text-gray-700">{patient.medicalHistory || 'None provided.'}</p>
            </div>

            {role === 'Healthcare Worker' && (
                <div className="mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('visit')}
                            className={`flex items-center px-4 py-2 -mb-px text-sm font-medium ${activeTab === 'visit'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <DocumentTextIcon className="w-5 h-5 mr-2" />
                            Add Visit
                        </button>
                        <button
                            onClick={() => setActiveTab('immunization')}
                            className={`flex items-center px-4 py-2 -mb-px text-sm font-medium ${activeTab === 'immunization'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FaSyringe className="w-5 h-5 mr-2" />
                            Add Immunization
                        </button>
                        <button
                            onClick={() => setActiveTab('referral')}
                            className={`flex items-center px-4 py-2 -mb-px text-sm font-medium ${activeTab === 'referral'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <ArrowRightCircleIcon className="w-5 h-5 mr-2" />
                            Add Referral
                        </button>
                    </div>
                    <div className="mt-4">
                        {activeTab === 'visit' && (
                            <form onSubmit={handleVisitSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="date" className="block text-gray-700 mb-2">
                                            Visit Date (YYYY-MM-DD)
                                        </label>
                                        <input
                                            type="text"
                                            id="date"
                                            name="date"
                                            value={visitForm.date}
                                            onChange={(e) => handleFormChange(e, 'visit')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.date ? 'border-red-500' : ''
                                                }`}
                                            required
                                        />
                                        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="symptoms" className="block text-gray-700 mb-2">
                                            Symptoms
                                        </label>
                                        <input
                                            type="text"
                                            id="symptoms"
                                            name="symptoms"
                                            value={visitForm.symptoms}
                                            onChange={(e) => handleFormChange(e, 'visit')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.symptoms ? 'border-red-500' : ''
                                                }`}
                                            required
                                        />
                                        {errors.symptoms && <p className="text-red-500 text-sm mt-1">{errors.symptoms}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="diagnoses" className="block text-gray-700 mb-2">
                                            Diagnoses
                                        </label>
                                        <input
                                            type="text"
                                            id="diagnoses"
                                            name="diagnoses"
                                            value={visitForm.diagnoses}
                                            onChange={(e) => handleFormChange(e, 'visit')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.diagnoses ? 'border-red-500' : ''
                                                }`}
                                            required
                                        />
                                        {errors.diagnoses && <p className="text-red-500 text-sm mt-1">{errors.diagnoses}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="treatments" className="block text-gray-700 mb-2">
                                            Treatments
                                        </label>
                                        <input
                                            type="text"
                                            id="treatments"
                                            name="treatments"
                                            value={visitForm.treatments}
                                            onChange={(e) => handleFormChange(e, 'visit')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.treatments ? 'border-red-500' : ''
                                                }`}
                                            required
                                        />
                                        {errors.treatments && <p className="text-red-500 text-sm mt-1">{errors.treatments}</p>}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="notes" className="block text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={visitForm.notes}
                                        onChange={(e) => handleFormChange(e, 'visit')}
                                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.notes ? 'border-red-500' : ''
                                            }`}
                                        rows="4"
                                        required
                                    />
                                    {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes}</p>}
                                </div>
                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className={`w-full p-3 rounded-lg text-white transition ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Add Visit'}
                                </button>
                            </form>
                        )}
                        {activeTab === 'immunization' && (
                            <form onSubmit={handleImmunizationSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="vaccineType" className="block text-gray-700 mb-2">
                                            Vaccine Type
                                        </label>
                                        <input
                                            type="text"
                                            id="vaccineType"
                                            name="vaccineType"
                                            value={immunizationForm.vaccineType}
                                            onChange={(e) => handleFormChange(e, 'immunization')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.vaccineType ? 'border-red-500' : ''
                                                }`}
                                            required
                                        />
                                        {errors.vaccineType && <p className="text-red-500 text-sm mt-1">{errors.vaccineType}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="dose" className="block text-gray-700 mb-2">
                                            Dose
                                        </label>
                                        <input
                                            type="number"
                                            id="dose"
                                            name="dose"
                                            value={immunizationForm.dose}
                                            onChange={(e) => handleFormChange(e, 'immunization')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.dose ? 'border-red-500' : ''
                                                }`}
                                            required
                                            min="1"
                                        />
                                        {errors.dose && <p className="text-red-500 text-sm mt-1">{errors.dose}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="dateAdministered" className="block text-gray-700 mb-2">
                                            Date Administered (YYYY-MM-DD)
                                        </label>
                                        <input
                                            type="text"
                                            id="dateAdministered"
                                            name="dateAdministered"
                                            value={immunizationForm.dateAdministered}
                                            onChange={(e) => handleFormChange(e, 'immunization')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.dateAdministered ? 'border-red-500' : ''
                                                }`}
                                            required
                                        />
                                        {errors.dateAdministered && <p className="text-red-500 text-sm mt-1">{errors.dateAdministered}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="nextDueDate" className="block text-gray-700 mb-2">
                                            Next Due Date (YYYY-MM-DD, Optional)
                                        </label>
                                        <input
                                            type="text"
                                            id="nextDueDate"
                                            name="nextDueDate"
                                            value={immunizationForm.nextDueDate}
                                            onChange={(e) => handleFormChange(e, 'immunization')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.nextDueDate ? 'border-red-500' : ''
                                                }`}
                                        />
                                        {errors.nextDueDate && <p className="text-red-500 text-sm mt-1">{errors.nextDueDate}</p>}
                                    </div>
                                </div>
                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className={`w-full p-3 rounded-lg text-white transition ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Add Immunization'}
                                </button>
                            </form>
                        )}
                        {activeTab === 'referral' && (
                            <form onSubmit={handleReferralSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="facility" className="block text-gray-700 mb-2">
                                            Facility
                                        </label>
                                        <input
                                            type="text"
                                            id="facility"
                                            name="facility"
                                            value={referralForm.facility}
                                            onChange={(e) => handleFormChange(e, 'referral')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.facility ? 'border-red-500' : ''
                                                }`}
                                            required
                                        />
                                        {errors.facility && <p className="text-red-500 text-sm mt-1">{errors.facility}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="reason" className="block text-gray-700 mb-2">
                                            Reason
                                        </label>
                                        <input
                                            type="text"
                                            id="reason"
                                            name="reason"
                                            value={referralForm.reason}
                                            onChange={(e) => handleFormChange(e, 'referral')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.reason ? 'border-red-500' : ''
                                                }`}
                                            required
                                        />
                                        {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="referralDate" className="block text-gray-700 mb-2">
                                            Referral Date (YYYY-MM-DD)
                                        </label>
                                        <input
                                            type="text"
                                            id="referralDate"
                                            name="referralDate"
                                            value={referralForm.referralDate}
                                            onChange={(e) => handleFormChange(e, 'referral')}
                                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.referralDate ? 'border-red-500' : ''
                                                }`}
                                            required
                                        />
                                        {errors.referralDate && <p className="text-red-500 text-sm mt-1">{errors.referralDate}</p>}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="notes" className="block text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={referralForm.notes}
                                        onChange={(e) => handleFormChange(e, 'referral')}
                                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.notes ? 'border-red-500' : ''
                                            }`}
                                        rows="4"
                                        required
                                    />
                                    {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes}</p>}
                                </div>
                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className={`w-full p-3 rounded-lg text-white transition ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Add Referral'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold text-blue-600 mb-4">Visit Logs</h2>
            {visits.length === 0 ? (
                <p className="text-gray-700">No visits recorded.</p>
            ) : (
                <div className="overflow-x-auto mb-6">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-blue-100">
                                <th className="px-4 py-2 text-left text-gray-700">Date</th>
                                <th className="px-4 py-2 text-left text-gray-700">Symptoms</th>
                                <th className="px-4 py-2 text-left text-gray-700">Diagnoses</th>
                                <th className="px-4 py-2 text-left text-gray-700">Treatments</th>
                                <th className="px-4 py-2 text-left text-gray-700">Notes</th>
                                <th className="px-4 py-2 text-left text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visits.map((visit) => (
                                <tr key={visit.id} className="border-b">
                                    <td className="px-4 py-2">{visit.date}</td>
                                    <td className="px-4 py-2">{visit.symptoms}</td>
                                    <td className="px-4 py-2">{visit.diagnoses}</td>
                                    <td className="px-4 py-2">{visit.treatments}</td>
                                    <td className="px-4 py-2">{visit.notes}</td>
                                    <td className="px-4 py-2">{visit.offline ? <span className="text-yellow-500">Pending Sync</span> : 'Synced'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <h2 className="text-2xl font-bold text-blue-600 mb-4">Immunizations</h2>
            {immunizations.length === 0 ? (
                <p className="text-gray-700">No immunizations recorded.</p>
            ) : (
                <div className="overflow-x-auto mb-6">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-blue-100">
                                <th className="px-4 py-2 text-left text-gray-700">Vaccine Type</th>
                                <th className="px-4 py-2 text-left text-gray-700">Dose</th>
                                <th className="px-4 py-2 text-left text-gray-700">Date Administered</th>
                                <th className="px-4 py-2 text-left text-gray-700">Next Due Date</th>
                                <th className="px-4 py-2 text-left text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {immunizations.map((immunization) => (
                                <tr key={immunization.id} className="border-b">
                                    <td className="px-4 py-2">{immunization.vaccineType}</td>
                                    <td className="px-4 py-2">{immunization.dose}</td>
                                    <td className="px-4 py-2">{immunization.dateAdministered}</td>
                                    <td className="px-4 py-2">{immunization.nextDueDate || 'N/A'}</td>
                                    <td className="px-4 py-2">
                                        {immunization.offline ? (
                                            <span className="text-yellow-500">Pending Sync</span>
                                        ) : isOverdue(immunization.nextDueDate) ? (
                                            <span className="text-red-500 font-semibold">Overdue</span>
                                        ) : (
                                            'On Schedule'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <h2 className="text-2xl font-bold text-blue-600 mb-4">Referrals</h2>
            {referrals.length === 0 ? (
                <p className="text-gray-700">No referrals recorded.</p>
            ) : (
                <div className="overflow-x-auto mb-6">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-blue-100">
                                <th className="px-4 py-2 text-left text-gray-700">Facility</th>
                                <th className="px-4 py-2 text-left text-gray-700">Reason</th>
                                <th className="px-4 py-2 text-left text-gray-700">Referral Date</th>
                                <th className="px-4 py-2 text-left text-gray-700">Notes</th>
                                <th className="px-4 py-2 text-left text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referrals.map((referral) => (
                                <tr key={referral.id} className="border-b">
                                    <td className="px-4 py-2">{referral.facility}</td>
                                    <td className="px-4 py-2">{referral.reason}</td>
                                    <td className="px-4 py-2">{referral.referralDate}</td>
                                    <td className="px-4 py-2">{referral.notes}</td>
                                    <td className="px-4 py-2">{referral.offline ? <span className="text-yellow-500">Pending Sync</span> : 'Synced'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}