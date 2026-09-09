import api from './api';

export const getAllMedications = async () => {
    const response = await api.get('/medications');
    return response.data.data;
};

export const addMedication = async (medicationData) => {
    const response = await api.post('/medications', medicationData);
    return response.data.data;
};

export const updateMedicationStatus = async (id, status) => {
    const response = await api.put(`/medications/${id}/status`, { status });
    return response.data.data;
};

export const deleteMedication = async (id) => {
    const response = await api.delete(`/medications/${id}`);
    return response.data.data;
};

export const getMedicationStats = async () => {
    const response = await api.get('/medications/stats');
    return response.data.data;
};

const medicationService = {
    getAll: getAllMedications,
    add: addMedication,
    updateStatus: updateMedicationStatus,
    delete: deleteMedication,
    getStats: getMedicationStats
};

export default medicationService;