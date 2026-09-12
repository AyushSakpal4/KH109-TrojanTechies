import { useMemo, useState } from 'react';
import { useUsersList, useDisastersList } from '../api/hooks';
import {
    useZonesSummary,
    useCoordinatorMetrics,
    useCloseDisaster,
    useDeactivateVolunteer,
    useFreezeZone,
    useReassignTasksFromInactiveCoordinator,
} from '../api/useCommandCenter';
import { ConfirmModal } from './command-center/ConfirmModal';
import styles from './SettingsPanel.module.css';

export function SettingsPanel({ isOpen, onClose }) {
    const [action, setAction] = useState(null);

    const [inactiveCoordinatorId, setInactiveCoordinatorId] = useState('');
    const [targetCoordinatorId, setTargetCoordinatorId] = useState('');
    const [volunteerId, setVolunteerId] = useState('');
    const [disasterId, setDisasterId] = useState('');
    const [zoneId, setZoneId] = useState('');

    const { data: users } = useUsersList();
    const { data: zones } = useZonesSummary();
    const { data: disasters } = useDisastersList();
    const { data: coordinatorMetrics } = useCoordinatorMetrics();

    const reassignMutation = useReassignTasksFromInactiveCoordinator();
    const deactivateMutation = useDeactivateVolunteer();
    const closeDisasterMutation = useCloseDisaster();
    const freezeZoneMutation = useFreezeZone();

    const coordinatorsFromMetrics = useMemo(
        () => (Array.isArray(coordinatorMetrics) ? coordinatorMetrics : []),
        [coordinatorMetrics],
    );

    const volunteers = useMemo(
        () => (Array.isArray(users) ? users.filter((u) => u.role === 'volunteer') : []),
        [users],
    );

    if (!isOpen) return null;

    const runAction = async () => {
        if (action === 'reassign') {
            await reassignMutation.mutateAsync({ inactiveCoordinatorId, targetCoordinatorId });
        }
        if (action === 'deactivate' && volunteerId) {
            await deactivateMutation.mutateAsync({ volunteerId, reason: 'Admin deactivation workflow' });
        }
        if (action === 'close_disaster' && disasterId) {
            await closeDisasterMutation.mutateAsync(disasterId);
        }
        if (action === 'freeze_zone' && zoneId) {
            await freezeZoneMutation.mutateAsync({ zoneId, note: 'Frozen by admin workflow' });
        }
        setAction(null);
    };

    const isLoading =
        reassignMutation.isPending ||
        deactivateMutation.isPending ||
        closeDisasterMutation.isPending ||
        freezeZoneMutation.isPending;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>System Settings</h2>
                        <p className={styles.subtitle}>Admin configurations and bulk workflows</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className={styles.content}>
                    <section className={styles.card}>
                        <h3 className={styles.cardTitle}>Reassign Tasks from Inactive Coordinator</h3>
                        <div className={styles.filtersRow}>
                            <select className={styles.select} value={inactiveCoordinatorId} onChange={(e) => setInactiveCoordinatorId(e.target.value)}>
                                <option value="">Inactive Coordinator</option>
                                {coordinatorsFromMetrics.map((c) => (
                                    <option key={c.coordinator_id || c.id} value={c.coordinator_id || c.id}>
                                        {c.coordinator_name || c.name}
                                    </option>
                                ))}
                            </select>
                            <select className={styles.select} value={targetCoordinatorId} onChange={(e) => setTargetCoordinatorId(e.target.value)}>
                                <option value="">Target Coordinator</option>
                                {coordinatorsFromMetrics.map((c) => (
                                    <option key={`t-${c.coordinator_id || c.id}`} value={c.coordinator_id || c.id}>
                                        {c.coordinator_name || c.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                className={`${styles.button} ${styles.primaryButton}`}
                                disabled={!inactiveCoordinatorId || !targetCoordinatorId}
                                onClick={() => setAction('reassign')}
                            >
                                Reassign
                            </button>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <h3 className={styles.cardTitle}>Deactivate Volunteer</h3>
                        <div className={styles.filtersRow}>
                            <select className={styles.select} value={volunteerId} onChange={(e) => setVolunteerId(e.target.value)}>
                                <option value="">Select Volunteer</option>
                                {volunteers.map((v) => (
                                    <option key={v.id} value={v.id}>{v.full_name || v.email || v.id}</option>
                                ))}
                            </select>
                            <button className={styles.button} disabled={!volunteerId} onClick={() => setAction('deactivate')}>
                                Deactivate
                            </button>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <h3 className={styles.cardTitle}>Close Disaster</h3>
                        <div className={styles.filtersRow}>
                            <select className={styles.select} value={disasterId} onChange={(e) => setDisasterId(e.target.value)}>
                                <option value="">Select Disaster</option>
                                {(Array.isArray(disasters) ? disasters : []).map((d) => (
                                    <option key={d.id} value={d.id}>{d.name || d.id}</option>
                                ))}
                            </select>
                            <button className={styles.button} disabled={!disasterId} onClick={() => setAction('close_disaster')}>
                                Close Disaster
                            </button>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <h3 className={styles.cardTitle}>Freeze Zone</h3>
                        <div className={styles.filtersRow}>
                            <select className={styles.select} value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                                <option value="">Select Zone</option>
                                {(Array.isArray(zones) ? zones : []).map((z) => (
                                    <option key={z.zone_id || z.id} value={z.zone_id || z.id}>{z.zone_name || z.name || z.id}</option>
                                ))}
                            </select>
                            <button className={styles.button} disabled={!zoneId} onClick={() => setAction('freeze_zone')}>
                                Freeze Zone
                            </button>
                        </div>
                    </section>
                </div>

                <ConfirmModal
                    open={!!action}
                    title="Confirm Admin Workflow Action"
                    text="This action will modify active disaster operations. Proceed only if validated."
                    loading={isLoading}
                    onCancel={() => setAction(null)}
                    onConfirm={runAction}
                />
            </div>
        </div>
    );
}
