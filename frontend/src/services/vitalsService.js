import api from './api';

// Get latest vitals
export const getLatestVitals = async () => {
    const response = await api.get('/vitals/latest');
    return response.data.data;
};

// Get vitals history (last 7 days)
export const getVitalsHistory = async () => {
    const response = await api.get('/vitals/history');
    return response.data.data;
};

// Get vitals by date range
export const getVitalsByDateRange = async (startDate, endDate) => {
    const response = await api.get('/vitals/range', {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data.data;
};

// Add new vitals
export const addVitals = async (vitalsData) => {
    const response = await api.post('/vitals', vitalsData);
    return response.data.data;
};

// Update vitals
export const updateVitals = async (id, vitalsData) => {
    const response = await api.put(`/vitals/${id}`, vitalsData);
    return response.data.data;
};

// Delete vitals
export const deleteVitals = async (id) => {
    const response = await api.delete(`/vitals/${id}`);
    return response.data.data;
};

// Get vitals statistics
export const getVitalsStats = async () => {
    const response = await api.get('/vitals/stats');
    return response.data.data;
};

const vitalsService = {
    getLatest: getLatestVitals,
    getHistory: getVitalsHistory,
    getByDateRange: getVitalsByDateRange,
    add: addVitals,
    update: updateVitals,
    delete: deleteVitals,
    getStats: getVitalsStats
};

export default vitalsService;