// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export const useAuth = () => {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
                    if (userDoc.exists()) {
                        setRole(userDoc.data().role)
                    } else {
                        console.error('No user document found for UID:', currentUser.uid)
                        setRole(null)
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error.message)
                    setRole(null)
                }
            } else {
                setUser(null)
                setRole(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return { user, role, loading }
}