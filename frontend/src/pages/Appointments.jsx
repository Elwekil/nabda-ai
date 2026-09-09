import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AppointmentsList from '../components/Appointments/AppointmentsList';
import AddAppointment from '../components/Appointments/AddAppointment';
import appointmentService from '../services/appointmentService';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

export default function Appointments() {
    const { t } = useLanguage();
    const [appointments, setAppointments] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAppointments(); }, []);

    const fetchAppointments = async () => {
        try {
            const data = await appointmentService.getAll();
            setAppointments(data.items || []);
        } catch (error) {
            toast.error(`${t('appointments.add_failed')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (appointmentData) => {
        try {
            await appointmentService.add(appointmentData);
            toast.success(t('appointments.appointment_added'));
            fetchAppointments();
        } catch (error) {
            toast.error(`${t('appointments.add_failed')}: ${error.message}`);
            throw error;
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await appointmentService.updateStatus(id, status);
            toast.success(t('appointments.status_updated'));
            fetchAppointments();
        } catch {
            toast.error(t('appointments.update_failed'));
        }
    };

    const handleDelete = async (id) => {
        try {
            await appointmentService.delete(id);
            toast.success(t('appointments.appointment_deleted'));
            fetchAppointments();
        } catch {
            toast.error(t('appointments.delete_failed'));
        }
    };

    if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{t('nav.appointments')}</h1>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 ml-2" />
                    {t('appointments.add_appointment')}
                </Button>
            </div>
            <AppointmentsList appointments={appointments} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />
            <AddAppointment isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAdd} />
        </div>
    );
}
