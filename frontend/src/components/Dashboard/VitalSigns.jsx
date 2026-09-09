import { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, Droplet, Plus } from 'lucide-react';
import vitalsService from '../../services/vitalsService';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

export default function VitalSigns() {
  const { t } = useLanguage()
  const [vitals, setVitals] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    blood_sugar: '', blood_pressure_systolic: '', blood_pressure_diastolic: '',
    heart_rate: '', temperature: '', pain_level: ''
  });

  useEffect(() => { fetchLatestVitals(); }, []);

  const fetchLatestVitals = async () => {
    try { setVitals(await vitalsService.getLatest()); }
    catch { setVitals(null); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await vitalsService.add({
        blood_sugar: formData.blood_sugar ? parseInt(formData.blood_sugar) : null,
        blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        pain_level: formData.pain_level ? parseInt(formData.pain_level) : null
      });
      toast.success(t('vital_signs.vitals_recorded'));
      await fetchLatestVitals();
      setShowForm(false);
      setFormData({ blood_sugar: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', heart_rate: '', temperature: '', pain_level: '' });
    } catch {
      toast.error(t('vital_signs.record_failed'));
    } finally {
      setLoading(false);
    }
  };

  const hasData = vitals && (vitals.blood_sugar || vitals.blood_pressure_systolic || vitals.heart_rate || vitals.temperature);

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t('vital_signs.title')}</h2>
          <button onClick={() => setShowForm(true)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {!hasData ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{t('common.no_data')}</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-primary-600 text-sm hover:underline">
              {t('common.add')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-xl text-center">
              <Droplet className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-600">{vitals.blood_sugar || '--'}</p>
              <p className="text-xs text-gray-500">{t('vital_signs.blood_sugar')}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-center">
              <Activity className="w-5 h-5 text-red-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-600">{vitals.blood_pressure_systolic || '--'}/{vitals.blood_pressure_diastolic || '--'}</p>
              <p className="text-xs text-gray-500">{t('vital_signs.blood_pressure')}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-center">
              <Heart className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-600">{vitals.heart_rate || '--'}</p>
              <p className="text-xs text-gray-500">{t('vital_signs.heart_rate')}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl text-center">
              <Thermometer className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-yellow-600">{vitals.temperature || '--'}°C</p>
              <p className="text-xs text-gray-500">{t('vital_signs.temperature')}</p>
            </div>
          </div>
        )}
        {vitals?.recorded_date && (
          <p className="text-xs text-gray-400 text-center mt-3">{t('vital_signs.last_updated')}: {vitals.recorded_date}</p>
        )}
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('vital_signs.record_vitals')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('vital_signs.blood_sugar')} type="number" name="blood_sugar" value={formData.blood_sugar} onChange={handleChange} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('vital_signs.blood_pressure')}</label>
              <div className="flex gap-2">
                <input type="number" name="blood_pressure_systolic" value={formData.blood_pressure_systolic} onChange={handleChange} placeholder={t('vital_signs.systolic')} className="w-full px-3 py-2 border rounded-xl" />
                <span className="self-center">/</span>
                <input type="number" name="blood_pressure_diastolic" value={formData.blood_pressure_diastolic} onChange={handleChange} placeholder={t('vital_signs.diastolic')} className="w-full px-3 py-2 border rounded-xl" />
              </div>
            </div>
            <Input label={t('vital_signs.heart_rate')} type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} />
            <Input label={t('vital_signs.temperature')} type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} />
            <Input label={t('vital_signs.pain_level')} type="number" min="1" max="10" name="pain_level" value={formData.pain_level} onChange={handleChange} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading}>{t('common.save')}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
