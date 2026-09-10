import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, CircleDashed, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WelcomeBanner from '../components/Dashboard/WelcomeBanner';
import StatsCards from '../components/Dashboard/StatsCards';
import VitalSigns from '../components/Dashboard/VitalSigns';
import RecentActivity from '../components/Dashboard/RecentActivity';
import BloodSugarChart from '../components/Dashboard/BloodSugarChart';
import SOSButton from '../components/Dashboard/SOSButton';
import LoadingSpinner from '../components/common/LoadingSpinner';

const profileFields = [
  'Name',
  'Age',
  'Blood type',
  'Allergies',
  'Chronic conditions',
  'Current medications',
  'Emergency contact',
  'Family doctor',
];

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

    const completedFields = [
        Boolean(user?.full_name),
        Boolean(user?.age),
        Boolean(user?.blood_type),
        Boolean(user?.allergies),
        Boolean(user?.chronic_conditions),
        Boolean(user?.current_medications || user?.medications),
        Boolean(user?.emergency_contact_name || user?.emergency_contact_phone),
        Boolean(user?.family_doctor_name || user?.family_doctor_phone),
    ].filter(Boolean).length;

    const completion = Math.min(100, Math.round((completedFields / profileFields.length) * 100));
    const isProfileIncomplete = completion < 100;

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="space-y-6">
            <WelcomeBanner user={user} />

            {isProfileIncomplete && (
                <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-amber-800">
                                <ClipboardList className="h-5 w-5" />
                                <h2 className="text-xl font-bold">Complete your health profile</h2>
                            </div>
                            <p className="max-w-2xl text-sm leading-6 text-amber-800/80">
                                Adding your basic health information helps NABDA provide more relevant health information and organize your medical records.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                                <span>Profile completion: {completion}%</span>
                            </div>
                            <div className="h-2.5 w-full max-w-md overflow-hidden rounded-full bg-amber-200">
                                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${completion}%` }} />
                            </div>
                        </div>

                        <Link to="/profile" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500">
                            Complete Profile <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {profileFields.map((label, index) => {
                            const isDone = completedFields > index || index < 2;
                            return (
                                <div key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${isDone ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-white text-amber-700'}`}>
                                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                                    {label}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
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
