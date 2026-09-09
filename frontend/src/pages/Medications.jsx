import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import MedicationsList from '../components/Medications/MedicationsList';
import AddMedication from '../components/Medications/AddMedication';
import AdherenceChart from '../components/Medications/AdherenceChart';
import DrugInteractionChecker from '../components/Medications/DrugInteractionChecker';
import medicationService from '../services/medicationService';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

export default function Medications() {
    const { t } = useLanguage();
    const [medications, setMedications] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchMedications(); }, []);

    const fetchMedications = async () => {
        try {
            const data = await medicationService.getAll();
            setMedications(data.items || []);
        } catch (error) {
            toast.error(`${t('medications.add_failed')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (medicationData) => {
        try {
            await medicationService.add(medicationData);
            toast.success(t('medications.medication_added'));
            fetchMedications();
        } catch (error) {
            toast.error(`${t('medications.add_failed')}: ${error.message}`);
            throw error;
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await medicationService.updateStatus(id, status);
            toast.success(t('medications.status_updated'));
            fetchMedications();
        } catch {
            toast.error(t('medications.update_failed'));
        }
    };

    const handleDelete = async (id) => {
        try {
            await medicationService.delete(id);
            toast.success(t('medications.medication_deleted'));
            fetchMedications();
        } catch {
            toast.error(t('medications.delete_failed'));
        }
    };

    if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{t('nav.medications')}</h1>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 ml-2" />
                    {t('medications.add_medication')}
                </Button>
            </div>
            <AdherenceChart medications={medications} />
            <MedicationsList medications={medications} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />
            <AddMedication isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAdd} />
        </div>
    );
}
