import api from './api';

export const getAllAppointments = async () => {
    const response = await api.get('/appointments');
    return response.data.data;
};

export const getUpcomingAppointments = async () => {
    const response = await api.get('/appointments/upcoming');
    return response.data.data;
};

export const addAppointment = async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data.data;
};

export const updateAppointmentStatus = async (id, status) => {
    const response = await api.put(`/appointments/${id}/status`, { status });
    return response.data.data;
};

export const deleteAppointment = async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data.data;
};

const appointmentService = {
    getAll: getAllAppointments,
    getUpcoming: getUpcomingAppointments,
    add: addAppointment,
    updateStatus: updateAppointmentStatus,
    delete: deleteAppointment
};

export default appointmentService;