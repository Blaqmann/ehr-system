// src/services/auth.js
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, collection, getDocs, updateDoc, addDoc, getDoc } from 'firebase/firestore'

export const signup = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        try {
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                role: 'Healthcare Worker',
                createdAt: new Date().toISOString()
            })
        } catch (firestoreError) {
            console.error('Firestore error during user document creation:', firestoreError.message)
        }
        return user
    } catch (error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                throw new Error('This email is already registered. Please use a different email or log in.')
            case 'auth/invalid-email':
                throw new Error('Please enter a valid email address.')
            case 'auth/weak-password':
                throw new Error('Password must be at least 6 characters long.')
            case 'auth/operation-not-allowed':
                throw new Error('Sign-up is currently disabled. Please contact support.')
            default:
                throw new Error('An error occurred during sign-up. Please try again or contact admin.')
        }
    }
}

export const login = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        return userCredential.user
    } catch (error) {
        switch (error.code) {
            case 'auth/invalid-credential':
                throw new Error('Invalid email or password. Please try again.')
            case 'auth/user-not-found':
                throw new Error('No account found with this email. Please sign up.')
            case 'auth/wrong-password':
                throw new Error('Incorrect password. Please try again.')
            case 'auth/too-many-requests':
                throw new Error('Too many login attempts. Please try again later.')
            default:
                throw new Error('An error occurred during login. Please try again or contact admin.')
        }
    }
}

export const logout = async () => {
    try {
        await signOut(auth)
    } catch (error) {
        throw new Error(error.message || 'An error occurred during logout. Please try again.')
    }
}

export const getAllUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'))
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch users. Please try again.')
    }
}

export const updateUserRole = async (userId, newRole) => {
    try {
        await updateDoc(doc(db, 'users', userId), { role: newRole })
    } catch (error) {
        throw new Error(error.message || 'Failed to update user role. Please try again.')
    }
}

export const registerPatient = async (patientData, userId) => {
    try {
        const patientDoc = await addDoc(collection(db, 'patients'), {
            ...patientData,
            userId,
            createdAt: new Date().toISOString(),
            lastVisit: null
        })
        return patientDoc.id
    } catch (error) {
        throw new Error(error.message || 'Failed to register patient. Please try again.')
    }
}

export const getPatients = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'patients'))
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch patients. Please try again.')
    }
}

export const getPatientById = async (patientId) => {
    try {
        const patientDoc = await getDoc(doc(db, 'patients', patientId))
        if (patientDoc.exists()) {
            return { id: patientDoc.id, ...patientDoc.data() }
        }
        throw new Error('Patient not found.')
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch patient details. Please try again.')
    }
}

export const addPatientVisit = async (patientId, visitData) => {
    try {
        if (navigator.onLine) {
            const { getOfflineData, resolveConflict } = await import('./offlineDB')
            const offlineDocs = await getOfflineData(patientId)
            const offlineVisit = offlineDocs.find(doc => doc.type === 'visit' && doc.data.date === visitData.date)
            if (offlineVisit) {
                visitData = await resolveConflict('visit', patientId, visitData, offlineVisit.data)
            }
            const visitDoc = await addDoc(collection(db, 'patients', patientId, 'visits'), {
                ...visitData,
                createdAt: new Date().toISOString()
            })
            await updateDoc(doc(db, 'patients', patientId), {
                lastVisit: new Date().toISOString()
            })
            return visitDoc.id
        } else {
            const { saveOfflineData } = await import('./offlineDB')
            await saveOfflineData('visit', visitData, patientId)
            return 'Saved offline'
        }
    } catch (error) {
        throw new Error(error.message || 'Failed to add patient visit. Please try again.')
    }
}

export const getPatientVisits = async (patientId) => {
    try {
        const querySnapshot = await getDocs(collection(db, 'patients', patientId, 'visits'));
        const onlineVisits = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let offlineVisits = [];
        try {
            const { getOfflineData } = await import('./offlineDB');
            const offlineDocs = await getOfflineData(patientId);
            offlineVisits = offlineDocs
                .filter(doc => doc.type === 'visit')
                .map(doc => ({ id: doc.id, ...doc.data, offline: true }));
        } catch (offlineError) {
            console.error('Offline data fetch error:', offlineError);
        }

        return [...onlineVisits, ...offlineVisits];
    } catch (error) {
        console.error('getPatientVisits error:', error);
        throw error;
    }
}

export const addImmunization = async (patientId, immunizationData) => {
    try {
        if (navigator.onLine) {
            const { getOfflineData, resolveConflict } = await import('./offlineDB')
            const offlineDocs = await getOfflineData(patientId)
            const offlineImmunization = offlineDocs.find(
                doc => doc.type === 'immunization' && doc.data.vaccineType === immunizationData.vaccineType && doc.data.dateAdministered === immunizationData.dateAdministered
            )
            if (offlineImmunization) {
                immunizationData = await resolveConflict('immunization', patientId, immunizationData, offlineImmunization.data)
            }
            const immunizationDoc = await addDoc(collection(db, 'patients', patientId, 'immunizations'), {
                ...immunizationData,
                createdAt: new Date().toISOString()
            })
            return immunizationDoc.id
        } else {
            const { saveOfflineData } = await import('./offlineDB')
            await saveOfflineData('immunization', immunizationData, patientId)
            return 'Saved offline'
        }
    } catch (error) {
        throw new Error(error.message || 'Failed to add immunization. Please try again.')
    }
}

export const getImmunizations = async (patientId) => {
    try {
        const querySnapshot = await getDocs(collection(db, 'patients', patientId, 'immunizations'))
        const onlineImmunizations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        let offlineImmunizations = [];
        try {
            const { getOfflineData } = await import('./offlineDB')
            const offlineDocs = await getOfflineData(patientId)
            offlineImmunizations = offlineDocs
                .filter(doc => doc.type === 'immunization')
                .map(doc => ({ id: doc.id, ...doc.data, offline: true }))
        } catch (offlineError) {
            console.error('Offline data fetch error:', offlineError);
        }

        return [...onlineImmunizations, ...offlineImmunizations]
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch immunizations. Please try again.')
    }
}

export const addReferral = async (patientId, referralData) => {
    try {
        if (navigator.onLine) {
            const { getOfflineData, resolveConflict } = await import('./offlineDB')
            const offlineDocs = await getOfflineData(patientId)
            const offlineReferral = offlineDocs.find(
                doc => doc.type === 'referral' && doc.data.referralDate === referralData.referralDate && doc.data.facility === referralData.facility
            )
            if (offlineReferral) {
                referralData = await resolveConflict('referral', patientId, referralData, offlineReferral.data)
            }
            const referralDoc = await addDoc(collection(db, 'patients', patientId, 'referrals'), {
                ...referralData,
                createdAt: new Date().toISOString()
            })
            return referralDoc.id
        } else {
            const { saveOfflineData } = await import('./offlineDB')
            await saveOfflineData('referral', referralData, patientId)
            return 'Saved offline'
        }
    } catch (error) {
        throw new Error(error.message || 'Failed to add referral. Please try again.')
    }
}

export const getReferrals = async (patientId) => {
    try {
        const querySnapshot = await getDocs(collection(db, 'patients', patientId, 'referrals'))
        const onlineReferrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        let offlineReferrals = [];
        try {
            const { getOfflineData } = await import('./offlineDB')
            const offlineDocs = await getOfflineData(patientId)
            offlineReferrals = offlineDocs
                .filter(doc => doc.type === 'referral')
                .map(doc => ({ id: doc.id, ...doc.data, offline: true }))
        } catch (offlineError) {
            console.error('Offline data fetch error:', offlineError);
        }

        return [...onlineReferrals, ...offlineReferrals]
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch referrals. Please try again.')
    }
}

export const syncOfflineData = async () => {
    if (navigator.onLine) {
        try {
            const { syncWithFirestore } = await import('./offlineDB')
            const count = await syncWithFirestore(addPatientVisit, addImmunization, addReferral)
            return count
        } catch (error) {
            throw new Error('Sync failed: ' + error.message)
        }
    }
    return 0
}