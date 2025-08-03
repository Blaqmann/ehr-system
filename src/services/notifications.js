// src/services/notifications.js
import { toast } from 'react-toastify';

// Track displayed alerts globally
const displayedAlerts = new Set();

export const checkAlerts = (immunizations) => {
    const alerts = [];
    const today = new Date().toISOString().split('T')[0];

    immunizations.forEach((imm) => {
        if (imm.nextDueDate && imm.nextDueDate < today && !imm.offline) {
            const alertKey = `followup-${imm.vaccineType}-${imm.nextDueDate}`;
            if (!displayedAlerts.has(alertKey)) {
                alerts.push({
                    type: 'followup',
                    message: `Follow-up immunization due for ${imm.vaccineType} on ${imm.nextDueDate}.`,
                    key: alertKey
                });
            }
        }
    });

    return alerts;
};

export const showOnscreenNotification = (message, key) => {
    if (!displayedAlerts.has(key)) {
        displayedAlerts.add(key);
        toast.warn(message, {
            position: 'top-right',
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'colored',
            onClose: () => displayedAlerts.delete(key)
        });
    }
};