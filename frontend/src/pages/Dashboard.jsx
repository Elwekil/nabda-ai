import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import WelcomeBanner from '../components/Dashboard/WelcomeBanner';
import StatsCards from '../components/Dashboard/StatsCards';
import VitalSigns from '../components/Dashboard/VitalSigns';
import RecentActivity from '../components/Dashboard/RecentActivity';
import BloodSugarChart from '../components/Dashboard/BloodSugarChart';
import SOSButton from '../components/Dashboard/SOSButton';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Dashboard() {
    const { user, getDashboardStats } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="space-y-6">
            <WelcomeBanner user={user} />
            <StatsCards stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <BloodSugarChart />
                    <RecentActivity />
                </div>
                <div className="space-y-6">
                    <VitalSigns />
                    <SOSButton />
                </div>
            </div>
        </div>
    );
}