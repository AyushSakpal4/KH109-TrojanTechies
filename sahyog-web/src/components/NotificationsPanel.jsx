import React from 'react';
import styles from './NotificationsPanel.module.css';

const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        type: 'alert',
        title: 'High Priority Alert',
        description: 'NDRF team needs immediate medical supplies at Sector 4.',
        time: '2 minutes ago',
        icon: 'warning',
        colorClass: styles.iconAlert
    },
    {
        id: 2,
        type: 'info',
        title: 'System Update',
        description: 'New satellite imagery for coastal regions is now available.',
        time: '1 hour ago',
        icon: 'info',
        colorClass: styles.iconInfo
    },
    {
        id: 3,
        type: 'success',
        title: 'Relief Dispatched',
        description: 'Helicopter dispatch #42 has successfully dropped medical supplies.',
        time: '3 hours ago',
        icon: 'check_circle',
        colorClass: styles.iconSuccess
    }
];

export function NotificationsPanel({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>Notifications</h2>
                        <p className={styles.subtitle}>Recent alerts and updates</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className={styles.content}>
                    {MOCK_NOTIFICATIONS.length > 0 ? (
                        MOCK_NOTIFICATIONS.map((notif) => (
                            <div key={notif.id} className={styles.notificationItem}>
                                <div className={`${styles.iconWrapper} ${notif.colorClass}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                                        {notif.icon}
                                    </span>
                                </div>
                                <div className={styles.notifText}>
                                    <p className={styles.notifTitle}>{notif.title}</p>
                                    <p className={styles.notifDesc}>{notif.description}</p>
                                    <span className={styles.notifTime}>{notif.time}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <span className={`material-symbols-outlined ${styles.emptyIcon}`}>notifications_off</span>
                            <p>You have no new notifications.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
