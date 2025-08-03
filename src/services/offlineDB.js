// src/services/offlineDB.js
import Dexie from 'dexie'

const db = new Dexie('ehr-offline')
//await db.delete()

db.version(3).stores({ 
    offlineData: 'id, type, patientId, createdAt, synced, &[patientId+type+createdAt]'
});

export const saveOfflineData = async (type, data, patientId) => {
    try {
        if (!db.isOpen()) {
            await db.open();
        }

        const id = `${type}_${patientId}_${Date.now()}`;
        const doc = {
            id,
            type,
            patientId,
            data,
            createdAt: new Date().toISOString(),
            synced: false
        };

        await db.offlineData.put(doc);
        return { id };
    } catch (error) {
        console.error('Save offline error:', error);
        throw error;
    }
}

export const getOfflineData = async (patientId) => {
    try {
        if (!db.isOpen()) {
            await db.open().catch(err => {
                console.error('Database open error:', err);
                throw err;
            });
        }

        return await db.offlineData
            .where('patientId').equals(patientId)
            .and(doc => doc.synced === false)
            .toArray();
    } catch (error) {
        console.error('getOfflineData error:', error);
        throw new Error(`Failed to fetch offline data: ${error.message}`);
    }
}

export const markAsSynced = async (id) => {
    try {
        await db.offlineData.update(id, { synced: true })
    } catch (error) {
        throw new Error(`Failed to mark as synced: ${error.message}`)
    }
}

export const syncWithFirestore = async (addPatientVisit, addImmunization, addReferral) => {
    try {
        const docs = await db.offlineData
            .filter(doc => doc.synced === false)
            .toArray();

        console.log('Found docs to sync:', docs.length);

        for (const doc of docs) {
            try {
                if (doc.type === 'visit') {
                    await addPatientVisit(doc.patientId, doc.data);
                } else if (doc.type === 'immunization') {
                    await addImmunization(doc.patientId, doc.data);
                } else if (doc.type === 'referral') {
                    await addReferral(doc.patientId, doc.data);
                }
                await db.offlineData.update(doc.id, { synced: true });
            } catch (error) {
                console.error(`Error syncing doc ${doc.id}:`, error);
            }
        }
        return docs.length;
    } catch (error) {
        console.error('Sync error:', error);
        throw error;
    }
}

export const resolveConflict = async (type, patientId, localData, remoteData) => {
    const localTimestamp = new Date(localData.createdAt).getTime()
    const remoteTimestamp = remoteData.createdAt ? new Date(remoteData.createdAt).getTime() : 0

    if (localTimestamp > remoteTimestamp) {
        return localData
    } else if (remoteTimestamp > localTimestamp) {
        return remoteData
    } else {
        const mergedData = { ...remoteData, ...localData }
        if (type === 'visit' || type === 'referral') {
            const notesSet = new Set([
                (remoteData.notes || '').trim(),
                (localData.notes || '').trim()
            ].filter(Boolean)) // remove empty strings

            mergedData.notes = Array.from(notesSet).join('\n')
        }

        return mergedData
    }
}