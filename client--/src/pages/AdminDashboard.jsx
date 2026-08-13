import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { API_URL } from '../config/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [clubHeads, setClubHeads] = useState([]);
    const [eventData, setEventData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [role, setRole] = useState(null);

    const [filters, setFilters] = useState({
        month: 'all',
        year: 'all',
        clubId: 'all'
    });

    const [showYearWise, setShowYearWise] = useState(false);
    const [selectedClub, setSelectedClub] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);

    const [coordinators, setCoordinators] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClub, setEditingClub] = useState(null);

    const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);
    const [editingCoord, setEditingCoord] = useState(null);

    // Payments Management
    const [manualPayments, setManualPayments] = useState([]);
    const [manualPaymentsSummary, setManualPaymentsSummary] = useState(null);
    const [paymentsSearch, setPaymentsSearch] = useState('');

    // Profile Management
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profile2FA, setProfile2FA] = useState(false);

    const [profilePasswordForm, setProfilePasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [searchParams] = useSearchParams();

    const tabParam = searchParams.get('tab');

    // ---------------------------------------------------------
    // TAB MANAGEMENT
    // ---------------------------------------------------------

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        } else if (role) {
            if (role === 'paymentAdmin') {
                setActiveTab('payouts');
            } else {
                setActiveTab('overview');
            }
        }
    }, [tabParam, role]);

    // ---------------------------------------------------------
    // API HELPERS
    // ---------------------------------------------------------

    const fetchManualPayments = async () => {
        try {
            const res = await axios.get(
                `${API_URL}/api/admin/manual-payments`
            );

            setManualPayments(res.data?.participations || []);
            setManualPaymentsSummary(res.data?.summary || null);
        } catch (err) {
            console.error(
                'Failed to fetch manual payments overview:',
                err
            );
        }
    };

    const fetchFilteredEventData = async () => {
        try {
            const query = new URLSearchParams(filters).toString();

            const res = await axios.get(
                `${API_URL}/api/admin/event-data-export?${query}`
            );

            setEventData(res.data?.events || []);
        } catch (err) {
            console.error(
                'Failed to fetch filtered event data:',
                err
            );
        }
    };

    const fetchClubs = async () => {
        const res = await axios.get(
            `${API_URL}/api/admin/clubs-list`
        );

        setClubHeads(res.data || []);
    };

    const fetchCoordinators = async () => {
        const res = await axios.get(
            `${API_URL}/api/admin/coordinators`
        );

        setCoordinators(res.data || []);
    };

    // ---------------------------------------------------------
    // INITIAL DATA FETCH
    // ---------------------------------------------------------

    useEffect(() => {
        const adminDataString = localStorage.getItem('admin');

        if (!adminDataString) {
            navigate('/admin-secret-login');
            return;
        }

        let adminData;

        try {
            adminData = JSON.parse(adminDataString);
        } catch (err) {
            console.error('Invalid admin data in localStorage:', err);
            localStorage.removeItem('admin');
            navigate('/admin-secret-login');
            return;
        }

        setRole(adminData.role);
        setProfileName(adminData.name || '');
        setProfileEmail(adminData.email || '');
        setProfile2FA(adminData.isTwoStepEnabled || false);

        if (adminData.role === 'lostFoundAdmin') {
            navigate('/admin/lost-found');
            return;
        }

        if (adminData.role === 'facultyCoordinator') {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const statsRes = await axios.get(
                    `${API_URL}/api/admin/dashboard-stats`
                );

                setStats(statsRes.data);

                await fetchClubs();
                await fetchCoordinators();
                await fetchManualPayments();
                await fetchFilteredEventData();

            } catch (err) {
                console.error('Failed to fetch admin data:', err);

                showNotification(
                    err.response?.data?.message ||
                    'Failed to fetch admin data',
                    'error'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, showNotification]);

    // ---------------------------------------------------------
    // FILTERED EVENTS
    // ---------------------------------------------------------

    useEffect(() => {
        if (!loading) {
            fetchFilteredEventData();
        }
    }, [filters, loading]);

    // ---------------------------------------------------------
    // REFRESH STATS
    // ---------------------------------------------------------

    const refreshStats = async () => {
        try {
            const statsRes = await axios.get(
                `${API_URL}/api/admin/dashboard-stats`
            );

            setStats(statsRes.data);

            await fetchManualPayments();

        } catch (err) {
            console.error('Failed to refresh stats:', err);
        }
    };

    // ---------------------------------------------------------
    // PAYOUT
    // ---------------------------------------------------------

    const handleFetchPayoutInfo = async (clubHeadId, eventId) => {
        try {
            const res = await axios.get(
                `${API_URL}/api/admin/user-info/${clubHeadId}`
            );

            setSelectedClub(res.data);
            setSelectedEventId(eventId);
            setModalOpen(true);

        } catch (err) {
            console.error('Error fetching payout info:', err);

            showNotification(
                err.response?.data?.message ||
                'Error fetching payout info',
                'error'
            );
        }
    };

    const handleConfirmPayout = async () => {
        if (!selectedEventId) {
            showNotification(
                'No event selected for payout',
                'error'
            );
            return;
        }

        try {
            const res = await axios.post(
                `${API_URL}/api/admin/complete-payout/${selectedEventId}`
            );

            if (res.data?.success) {
                showNotification(
                    'Payout marked as complete!',
                    'success'
                );

                setModalOpen(false);
                setSelectedClub(null);
                setSelectedEventId(null);

                await refreshStats();
            }

        } catch (err) {
            console.error('Failed to update payout status:', err);

            showNotification(
                err.response?.data?.message ||
                'Failed to update payout status',
                'error'
            );
        }
    };

    // ---------------------------------------------------------
    // LOGOUT
    // ---------------------------------------------------------

    const handleLogout = () => {
        localStorage.removeItem('admin');
        localStorage.removeItem('user');
        localStorage.removeItem('role');

        navigate('/admin-secret-login');
    };

    // ---------------------------------------------------------
    // CSV DOWNLOAD
    // ---------------------------------------------------------

    const handleDownloadCSV = () => {
        if (!eventData.length) return;

        const headers = [
            'Event Name',
            'Organising Club',
            'Total Registrations',
            'Event Type',
            'Event Date',
            'Total Amount Received (₹)'
        ];

        const escapeCSV = (value) => {
            if (value === null || value === undefined) {
                return '""';
            }

            return `"${String(value).replace(/"/g, '""')}"`;
        };

        const rows = eventData.map((event) => [
            escapeCSV(event.eventName),
            escapeCSV(event.clubName),
            event.totalRegistrations ?? 0,
            escapeCSV(event.eventType),
            escapeCSV(
                event.eventDate
                    ? new Date(event.eventDate).toLocaleDateString()
                    : ''
            ),
            event.totalAmountReceived ?? 0
        ]);

        const csv = [
            headers.map(escapeCSV).join(','),
            ...rows.map((row) => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download =
            `event_data_${new Date().toISOString().slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    // ---------------------------------------------------------
    // CREATE CLUB
    // ---------------------------------------------------------

    const handleCreateClub = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await axios.post(
                `${API_URL}/api/admin/clubs`,
                data
            );

            showNotification(
                'Club and users created successfully',
                'success'
            );

            e.currentTarget.reset();

            await fetchClubs();
            await refreshStats();

        } catch (err) {
            console.error('Failed to create club:', err);

            showNotification(
                err.response?.data?.message ||
                'Failed to create club',
                'error'
            );
        }
    };

    // ---------------------------------------------------------
    // UPDATE CLUB
    // ---------------------------------------------------------

    const handleUpdateClub = async (e) => {
        e.preventDefault();

        if (!editingClub?._id) {
            showNotification(
                'No club selected',
                'error'
            );
            return;
        }

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await axios.put(
                `${API_URL}/api/admin/clubs/${editingClub._id}`,
                data
            );

            showNotification(
                'Club updated successfully',
                'success'
            );

            setIsEditModalOpen(false);
            setEditingClub(null);

            await fetchClubs();

        } catch (err) {
            console.error('Failed to update club:', err);

            showNotification(
                err.response?.data?.message ||
                'Failed to update club',
                'error'
            );
        }
    };

    // ---------------------------------------------------------
    // CREATE COORDINATOR
    // ---------------------------------------------------------

    const handleCreateCoord = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await axios.post(
                `${API_URL}/api/admin/coordinators`,
                data
            );

            showNotification(
                'Coordinator created successfully',
                'success'
            );

            e.currentTarget.reset();

            await fetchCoordinators();

        } catch (err) {
            console.error('Failed to create coordinator:', err);

            showNotification(
                err.response?.data?.message ||
                'Failed to create coordinator',
                'error'
            );
        }
    };

    // ---------------------------------------------------------
    // UPDATE COORDINATOR
    // ---------------------------------------------------------

    const handleUpdateCoord = async (e) => {
        e.preventDefault();

        if (!editingCoord?._id) {
            showNotification(
                'No coordinator selected',
                'error'
            );
            return;
        }

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await axios.put(
                `${API_URL}/api/admin/coordinators/${editingCoord._id}`,
                data
            );

            showNotification(
                'Coordinator updated successfully',
                'success'
            );

            setIsCoordModalOpen(false);
            setEditingCoord(null);

            await fetchCoordinators();

        } catch (err) {
            console.error(
                'Failed to update coordinator:',
                err
            );

            showNotification(
                err.response?.data?.message ||
                'Failed to update coordinator',
                'error'
            );
        }
    };

    // ---------------------------------------------------------
    // UPDATE PROFILE
    // ---------------------------------------------------------

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        setIsSavingProfile(true);

        try {
            const adminDataString =
                localStorage.getItem('admin');

            if (!adminDataString) {
                throw new Error('Admin session not found');
            }

            const adminData = JSON.parse(adminDataString);

            const adminId =
                adminData.id || adminData._id;

            if (!adminId) {
                throw new Error('Admin ID not found');
            }

            const updateRes = await axios.put(
                `${API_URL}/api/users/${adminData.role}/${adminId}`,
                {
                    name: profileName,
                    isTwoStepEnabled: profile2FA
                }
            );

            const updatedUser =
                updateRes.data?.user || {};

            const updatedAdmin = {
                ...adminData,
                name: updatedUser.name ?? profileName,
                isTwoStepEnabled:
                    updatedUser.isTwoStepEnabled ?? profile2FA
            };

            localStorage.setItem(
                'admin',
                JSON.stringify(updatedAdmin)
            );

            localStorage.setItem(
                'user',
                JSON.stringify(updatedAdmin)
            );

            showNotification(
                'Profile updated successfully',
                'success'
            );

        } catch (err) {
            console.error(
                'Failed to update profile:',
                err
            );

            showNotification(
                err.response?.data?.message ||
                err.message ||
                'Failed to update profile',
                'error'
            );
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ---------------------------------------------------------
    // CHANGE PASSWORD
    // ---------------------------------------------------------

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (
            profilePasswordForm.newPassword !==
            profilePasswordForm.confirmPassword
        ) {
            showNotification(
                'New passwords do not match',
                'error'
            );
            return;
        }

        if (
            profilePasswordForm.newPassword.length < 6
        ) {
            showNotification(
                'Password must be at least 6 characters long',
                'error'
            );
            return;
        }

        setIsSavingProfile(true);

        try {
            await axios.post(
                `${API_URL}/api/auth/change-password`,
                {
                    currentPassword:
                        profilePasswordForm.currentPassword,
                    newPassword:
                        profilePasswordForm.newPassword
                }
            );

            showNotification(
                'Password changed successfully',
                'success'
            );

            setProfilePasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

        } catch (err) {
            console.error(
                'Failed to change password:',
                err
            );

            showNotification(
                err.response?.data?.message ||
                'Failed to change password',
                'error'
            );
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ---------------------------------------------------------
    // TAB TITLES
    // ---------------------------------------------------------

    const tabTitles = {
        overview: {
            title: 'Overview',
            subtitle: 'All events at a glance'
        },

        payouts: {
            title: 'Payouts',
            subtitle: 'Manage settlement & revenue'
        },

        'payments-overview': {
            title: 'Payments Management',
            subtitle:
                'Overview of manual transaction registrations and statuses'
        },

        'club-heads': {
            title: 'Manage Clubs',
            subtitle: 'Create and edit registered clubs'
        },

        coordinators: {
            title: 'Coordinators',
            subtitle: 'Faculty coordinator accounts'
        },

        'event-data': {
            title: 'Event Data',
            subtitle: 'Filter, analyze & export'
        },

        profile: {
            title: 'Profile Settings',
            subtitle:
                'Update display name, password, and two-step verification'
        }
    };

    // ---------------------------------------------------------
    // LOADING SCREEN
    // ---------------------------------------------------------

    if (loading) {
        return (
            <div className="min-h-full bg-white dark:bg-[#0a0a0a] myfont animate-pulse">
                <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8">

                    <div className="mb-8 space-y-2">
                        <div className="h-7 w-48 bg-neutral-100 dark:bg-zinc-900 rounded-lg" />
                        <div className="h-4 w-72 bg-neutral-50 dark:bg-zinc-900/50 rounded-lg" />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-[#0c0c0c] space-y-3"
                            >
                                <div className="h-3 w-16 bg-neutral-200 dark:bg-zinc-800 rounded" />
                                <div className="h-8 w-24 bg-neutral-200 dark:bg-zinc-800 rounded-lg" />
                            </div>
                        ))}
                    </div>

                    <div className="border border-neutral-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#0a0a0a] space-y-4">
                        <div className="h-4 w-32 bg-neutral-200 dark:bg-zinc-800 rounded" />

                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex gap-4 items-center border-b border-neutral-100 dark:border-zinc-900 pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="h-4 w-6 bg-neutral-100 dark:bg-zinc-800 rounded" />
                                    <div className="h-4 flex-1 bg-neutral-100 dark:bg-zinc-800 rounded" />
                                    <div className="h-4 w-28 bg-neutral-100 dark:bg-zinc-800 rounded" />
                                    <div className="h-4 w-20 bg-neutral-100 dark:bg-zinc-800 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentTabInfo =
        tabTitles[activeTab] || tabTitles.overview;

    // ---------------------------------------------------------
    // MAIN UI
    // ---------------------------------------------------------

    return (
        <div className="min-h-full bg-white dark:bg-[#0a0a0a] myfont">
            <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8">

                {/* HEADER */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-black dark:text-white tracking-wide">
                            {currentTabInfo.title}
                        </h1>

                        <p className="text-neutral-400 dark:text-neutral-500 text-[12px] mt-0.5 tracking-wide font-medium">
                            {currentTabInfo.subtitle}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-auto">
                        <button
                            onClick={() => {
                                setActiveTab('club-heads');
                                navigate('/admin-dashboard?tab=club-heads', { replace: true });
                            }}
                            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                                activeTab === 'club-heads'
                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white'
                            }`}
                        >
                            + Create Club
                        </button>

                        <button
                            onClick={() => navigate('/create-event')}
                            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                            + Create New Event
                        </button>
                    </div>
                </div>

                {/* NAVIGATION TABS */}
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-zinc-800 mb-8 overflow-x-auto pb-2 scrollbar-none">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'club-heads', label: 'Manage Clubs' },
                        { id: 'coordinators', label: 'Coordinators' },
                        ...(role === 'admin' || role === 'paymentAdmin'
                            ? [
                                  { id: 'payouts', label: 'Payouts' },
                                  { id: 'payments-overview', label: 'Payments Management' }
                              ]
                            : []),
                        { id: 'event-data', label: 'Event Data' },
                        { id: 'profile', label: 'Profile Settings' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                navigate(`/admin-dashboard?tab=${tab.id}`, { replace: true });
                            }}
                            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-lg transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                                    : 'text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW STATS */}
                {activeTab === 'overview' && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard
                                label="Total Students"
                                value={stats?.totalStudents || 0}
                            />

                            <StatCard
                                label="Active Events"
                                value={stats?.totalEvents || 0}
                            />

                            <StatCard
                                label="Total Clubs"
                                value={stats?.totalClubs || 0}
                            />

                            <StatCard
                                label="Events (Till Today)"
                                value={stats?.totalEventsTillNow || 0}
                                accent
                            />
                        </div>

                        {role === 'admin' && (
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() =>
                                        setShowYearWise(!showYearWise)
                                    }
                                    className="text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-lg border border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all cursor-pointer"
                                >
                                    {showYearWise
                                        ? 'Hide Yearly Stats'
                                        : 'Show Year-wise Total Events'}
                                </button>
                            </div>
                        )}

                        {showYearWise &&
                            stats?.yearWiseEvents && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                                    {stats.yearWiseEvents.map((year) => (
                                        <div
                                            key={year._id}
                                            className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 p-3 rounded-xl text-center"
                                        >
                                            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                                                {year._id}
                                            </p>

                                            <p className="text-lg font-black text-black dark:text-white">
                                                {year.count}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </>
                )}

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <DataTable>
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                <Th>#</Th>
                                <Th>Event Title</Th>
                                <Th>Club</Th>
                                <Th>Registrations</Th>
                                <Th>Event Date</Th>
                                <Th>Type</Th>
                                <Th align="right">Revenue</Th>
                            </tr>
                        </thead>

                        <tbody>
                            {stats?.eventStats
                                ?.slice()
                                .sort(
                                    (a, b) =>
                                        new Date(b.startTime) -
                                        new Date(a.startTime)
                                )
                                .map((item, idx) => (
                                    <tr
                                        key={item.eventId || idx}
                                        className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                                    >
                                        <Td className="text-neutral-300 dark:text-neutral-600">
                                            {idx + 1}
                                        </Td>

                                        <Td className="font-semibold text-black dark:text-white">
                                            {item.title}
                                        </Td>

                                        <Td className="text-orange-600 dark:text-orange-400 font-semibold">
                                            {item.clubName}
                                        </Td>

                                        <Td>
                                            {item.registeredCount ??
                                                item.regCount ??
                                                0}{' '}
                                            students
                                        </Td>

                                        <Td className="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                                            {item.startTime
                                                ? new Date(
                                                      item.startTime
                                                  ).toLocaleString(
                                                      undefined,
                                                      {
                                                          dateStyle:
                                                              'medium',
                                                          timeStyle:
                                                              'short'
                                                      }
                                                  )
                                                : 'N/A'}
                                        </Td>

                                        <Td>
                                            <TypeBadge
                                                isPaid={
                                                    Number(
                                                        item.entryFee
                                                    ) > 0
                                                }
                                                fee={item.entryFee}
                                            />
                                        </Td>

                                        <Td
                                            align="right"
                                            className="font-mono font-black text-base"
                                        >
                                            {Number(
                                                item.totalCollected
                                            ) > 0 ? (
                                                <span className="text-orange-600 dark:text-orange-400">
                                                    ₹
                                                    {
                                                        item.totalCollected
                                                    }
                                                </span>
                                            ) : (
                                                <span className="text-neutral-200 dark:text-neutral-700">
                                                    —
                                                </span>
                                            )}
                                        </Td>
                                    </tr>
                                ))}

                            {(!stats?.eventStats ||
                                stats.eventStats.length === 0) && (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-16 text-center text-neutral-400 text-sm"
                                    >
                                        No events found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </DataTable>
                )}

                {/* PAYOUTS */}
                {activeTab === 'payouts' && (
                    <DataTable>
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                <Th>Club Name</Th>
                                <Th>Event Title</Th>
                                <Th>Amount</Th>
                                <Th>Registrations</Th>
                                <Th>Deadline</Th>
                                <Th align="right">Action</Th>
                            </tr>
                        </thead>

                        <tbody>
                            {stats?.eventStats
                                ?.filter(
                                    (item) =>
                                        Number(item.entryFee) > 0
                                )
                                .map((item, idx) => {
                                    const deadline =
                                        item.registrationDeadline ||
                                        item.startTime;

                                    const isLocked =
                                        deadline &&
                                        new Date() <
                                            new Date(deadline);

                                    return (
                                        <tr
                                            key={
                                                item.eventId || idx
                                            }
                                            className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                                        >
                                            <Td className="font-semibold text-black dark:text-white">
                                                {item.clubName}
                                            </Td>

                                            <Td>
                                                {item.title}
                                            </Td>

                                            <Td className="font-mono font-black text-orange-600 dark:text-orange-400 text-base">
                                                ₹
                                                {item.totalCollected ||
                                                    0}
                                            </Td>

                                            <Td>
                                                {item.regCount ||
                                                    item.registeredCount ||
                                                    0}{' '}
                                                students
                                            </Td>

                                            <Td className="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                                                {deadline
                                                    ? new Date(
                                                          deadline
                                                      ).toLocaleString(
                                                          undefined,
                                                          {
                                                              dateStyle:
                                                                  'short',
                                                              timeStyle:
                                                                  'short'
                                                          }
                                                      )
                                                    : 'N/A'}
                                            </Td>

                                            <Td align="right">
                                                {item.payoutStatus ===
                                                'COMPLETED' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-green-200 dark:border-green-500/20">
                                                        <i className="ri-checkbox-circle-fill text-sm" />
                                                        Completed
                                                    </span>
                                                ) : isLocked ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-not-allowed">
                                                            <i className="ri-lock-2-line text-sm" />
                                                            Locked
                                                        </span>

                                                        <span className="text-[9px] font-medium text-neutral-300 dark:text-neutral-600 mt-1">
                                                            After deadline
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handleFetchPayoutInfo(
                                                                item.clubHeadId,
                                                                item.eventId
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        Make Payout
                                                    </button>
                                                )}
                                            </Td>
                                        </tr>
                                    );
                                })}

                            {(!stats?.eventStats ||
                                stats.eventStats.filter(
                                    (item) =>
                                        Number(item.entryFee) > 0
                                ).length === 0) && (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-5 py-16 text-center text-neutral-400 text-sm"
                                    >
                                        No paid events found for payout.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </DataTable>
                )}

                {/* PAYMENTS MANAGEMENT */}
                {activeTab === 'payments-overview' && (
                    <div className="space-y-6">

                        {manualPaymentsSummary && (
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

                                <StatCard
                                    label="Total Payments"
                                    value={
                                        manualPaymentsSummary.total || 0
                                    }
                                />

                                <SummaryCard
                                    label="Pending Approvals"
                                    value={
                                        manualPaymentsSummary.pending ||
                                        0
                                    }
                                    color="amber"
                                />

                                <SummaryCard
                                    label="Approved"
                                    value={
                                        manualPaymentsSummary.approved ||
                                        0
                                    }
                                    color="emerald"
                                />

                                <SummaryCard
                                    label="Rejected"
                                    value={
                                        manualPaymentsSummary.rejected ||
                                        0
                                    }
                                    color="rose"
                                />

                                <SummaryCard
                                    label="Need Details"
                                    value={
                                        manualPaymentsSummary.needMoreDetails ||
                                        0
                                    }
                                    color="orange"
                                />
                            </div>
                        )}

                        {/* SEARCH */}
                        <div className="relative">
                            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 text-base" />

                            <input
                                type="text"
                                placeholder="Search by student, event, club, roll number or Transaction ID/UTR..."
                                value={paymentsSearch}
                                onChange={(e) =>
                                    setPaymentsSearch(
                                        e.target.value
                                    )
                                }
                                className="w-full pl-11 pr-10 py-3 border border-neutral-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#0a0a0a] text-black dark:text-white text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-neutral-400"
                            />

                            {paymentsSearch && (
                                <button
                                    onClick={() =>
                                        setPaymentsSearch('')
                                    }
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer border-0 bg-transparent"
                                >
                                    <i className="ri-close-line text-lg" />
                                </button>
                            )}
                        </div>

                        {/* PAYMENTS TABLE */}
                        <DataTable>
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                    <Th>#</Th>
                                    <Th>Event & Club</Th>
                                    <Th>Participant Details</Th>
                                    <Th>Payer & UTR Info</Th>
                                    <Th>Amount</Th>
                                    <Th>Status</Th>
                                    <Th align="right">Date</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {(() => {
                                    const query =
                                        paymentsSearch
                                            .trim()
                                            .toLowerCase();

                                    const filtered =
                                        manualPayments.filter(
                                            (payment) => {
                                                if (!query) {
                                                    return true;
                                                }

                                                return [
                                                    payment.studentName,
                                                    payment.studentRollNo,
                                                    payment.studentEmail,
                                                    payment.eventName,
                                                    payment.clubName,
                                                    payment.transactionId,
                                                    payment.payerName
                                                ].some((value) =>
                                                    String(
                                                        value || ''
                                                    )
                                                        .toLowerCase()
                                                        .includes(query)
                                                );
                                            }
                                        );

                                    if (filtered.length === 0) {
                                        return (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    className="px-5 py-16 text-center text-neutral-400 text-sm"
                                                >
                                                    No transaction
                                                    registrations
                                                    found.
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return filtered.map(
                                        (item, idx) => (
                                            <tr
                                                key={
                                                    item.id ||
                                                    item._id ||
                                                    idx
                                                }
                                                className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                                            >
                                                <Td className="text-neutral-300 dark:text-neutral-600">
                                                    {idx + 1}
                                                </Td>

                                                <Td>
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-semibold text-black dark:text-white">
                                                            {
                                                                item.eventName
                                                            }
                                                        </span>

                                                        <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                                                            {
                                                                item.clubName
                                                            }
                                                        </span>
                                                    </div>
                                                </Td>

                                                <Td>
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                            {
                                                                item.studentName
                                                            }
                                                        </span>

                                                        <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                                            {
                                                                item.studentRollNo
                                                            }{' '}
                                                            •{' '}
                                                            {
                                                                item.studentEmail
                                                            }
                                                        </span>
                                                    </div>
                                                </Td>

                                                <Td>
                                                    <div className="flex flex-col text-left">
                                                        {item.transactionId && (
                                                            <span className="font-mono text-xs text-neutral-800 dark:text-neutral-100">
                                                                UTR:{' '}
                                                                <strong className="select-all">
                                                                    {
                                                                        item.transactionId
                                                                    }
                                                                </strong>
                                                            </span>
                                                        )}

                                                        {item.payerName && (
                                                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                                Payer:{' '}
                                                                {
                                                                    item.payerName
                                                                }
                                                            </span>
                                                        )}

                                                        {item.paymentRemarks && (
                                                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 italic">
                                                                "
                                                                {
                                                                    item.paymentRemarks
                                                                }
                                                                "
                                                            </span>
                                                        )}
                                                    </div>
                                                </Td>

                                                <Td className="font-mono font-bold">
                                                    ₹
                                                    {item.amountPaid ??
                                                        0}
                                                </Td>

                                                <Td>
                                                    <span
                                                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${
                                                            item.paymentStatus ===
                                                                'APPROVED' ||
                                                            item.paymentStatus ===
                                                                'SUCCESS'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                                                                : item.paymentStatus ===
                                                                  'REJECTED'
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                                                        }`}
                                                    >
                                                        {item.paymentStatus ||
                                                            'PENDING'}
                                                    </span>
                                                </Td>

                                                <Td
                                                    align="right"
                                                    className="text-[11px] text-neutral-400 dark:text-neutral-400 font-mono"
                                                >
                                                    {item.createdAt
                                                        ? new Date(
                                                              item.createdAt
                                                          ).toLocaleDateString()
                                                        : 'N/A'}
                                                </Td>
                                            </tr>
                                        )
                                    );
                                })()}
                            </tbody>
                        </DataTable>
                    </div>
                )}

                {/* MANAGE CLUBS */}
                {activeTab === 'club-heads' && (
                    <div className="space-y-6">

                        <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-zinc-800 p-6 rounded-2xl">
                            <h3 className="text-sm font-bold text-black dark:text-white mb-4">
                                Add New Club
                            </h3>

                            <form
                                onSubmit={handleCreateClub}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
                            >
                                <FormInput
                                    name="clubName"
                                    placeholder="Club Name"
                                    required
                                />

                                <FormInput
                                    name="facultyName"
                                    placeholder="Faculty Coordinator"
                                    required
                                />

                                <FormInput
                                    name="facultyEmail"
                                    type="email"
                                    placeholder="Faculty Email"
                                    required
                                />

                                <FormInput
                                    name="clubEmail"
                                    type="email"
                                    placeholder="Official Club Email"
                                    required
                                />

                                <div className="lg:col-span-4 flex justify-end mt-1">
                                    <button
                                        type="submit"
                                        className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                                    >
                                        Create Club & Seed Users
                                    </button>
                                </div>
                            </form>
                        </div>

                        <DataTable>
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                    <Th>Club Name</Th>
                                    <Th>Faculty</Th>
                                    <Th>Club Email</Th>
                                    <Th align="right">Action</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {clubHeads.map((club, idx) => (
                                    <tr
                                        key={
                                            club._id || idx
                                        }
                                        className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                                    >
                                        <Td className="font-semibold text-black dark:text-white">
                                            {club.clubName}
                                        </Td>

                                        <Td>
                                            <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                                {club.facultyName ||
                                                    club.facultyCoordinator
                                                        ?.name ||
                                                    'N/A'}
                                            </span>

                                            <br />

                                            <span className="text-[10px] text-neutral-400">
                                                {club.facultyEmail ||
                                                    club.facultyCoordinator
                                                        ?.email ||
                                                    ''}
                                            </span>
                                        </Td>

                                        <Td>
                                            {club.clubEmail ||
                                                club.memberships?.[0]
                                                    ?.student
                                                    ?.email ||
                                                'N/A'}
                                        </Td>

                                        <Td align="right">
                                            <button
                                                onClick={() => {
                                                    setEditingClub(
                                                        club
                                                    );
                                                    setIsEditModalOpen(
                                                        true
                                                    );
                                                }}
                                                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white text-neutral-500 transition-all cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </Td>
                                    </tr>
                                ))}

                                {clubHeads.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-5 py-16 text-center text-neutral-400 text-sm"
                                        >
                                            No clubs registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </DataTable>
                    </div>
                )}

                {/* COORDINATORS */}
                {activeTab === 'coordinators' && (
                    <div className="space-y-6">

                        <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-zinc-800 p-6 rounded-2xl">
                            <h3 className="text-sm font-bold text-black dark:text-white mb-4">
                                Add Faculty Coordinator
                            </h3>

                            <form
                                onSubmit={handleCreateCoord}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
                            >
                                <FormInput
                                    name="name"
                                    placeholder="Full Name"
                                    required
                                />

                                <FormInput
                                    name="email"
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                />

                                <FormInput
                                    name="password"
                                    type="password"
                                    placeholder="Password (default: coordinator123)"
                                />

                                <button
                                    type="submit"
                                    className="bg-black dark:bg-white text-white dark:text-black py-3 text-[11px] font-bold uppercase tracking-[0.15em] rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                    Create Coordinator
                                </button>
                            </form>
                        </div>

                        <DataTable>
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                    <Th>Name</Th>
                                    <Th>Email</Th>
                                    <Th align="right">Action</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {coordinators.map(
                                    (coord, idx) => (
                                        <tr
                                            key={
                                                coord._id ||
                                                idx
                                            }
                                            className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                                        >
                                            <Td className="font-semibold text-black dark:text-white">
                                                {coord.name}
                                            </Td>

                                            <Td>
                                                {coord.email}
                                            </Td>

                                            <Td align="right">
                                                <button
                                                    onClick={() => {
                                                        setEditingCoord(
                                                            coord
                                                        );
                                                        setIsCoordModalOpen(
                                                            true
                                                        );
                                                    }}
                                                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white text-neutral-500 transition-all cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                            </Td>
                                        </tr>
                                    )
                                )}

                                {coordinators.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-5 py-16 text-center text-neutral-400 text-sm"
                                        >
                                            No coordinators found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </DataTable>
                    </div>
                )}

                {/* EVENT DATA */}
                {activeTab === 'event-data' && (
                    <div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">

                            <FilterSelect
                                value={filters.clubId}
                                onChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        clubId: value
                                    })
                                }
                            >
                                <option value="all">
                                    All Clubs
                                </option>

                                {clubHeads.map((club) => (
                                    <option
                                        key={club._id}
                                        value={club._id}
                                    >
                                        {club.clubName}
                                    </option>
                                ))}
                            </FilterSelect>

                            <FilterSelect
                                value={filters.month}
                                onChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        month: value
                                    })
                                }
                            >
                                <option value="all">
                                    All Months
                                </option>

                                {[...Array(12)].map(
                                    (_, i) => (
                                        <option
                                            key={i + 1}
                                            value={i + 1}
                                        >
                                            {new Date(
                                                2000,
                                                i,
                                                1
                                            ).toLocaleString(
                                                'en',
                                                {
                                                    month: 'long'
                                                }
                                            )}
                                        </option>
                                    )
                                )}
                            </FilterSelect>

                            <FilterSelect
                                value={filters.year}
                                onChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        year: value
                                    })
                                }
                            >
                                <option value="all">
                                    All Years
                                </option>

                                {[2024, 2025, 2026].map(
                                    (year) => (
                                        <option
                                            key={year}
                                            value={year}
                                        >
                                            {year}
                                        </option>
                                    )
                                )}
                            </FilterSelect>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wide">
                                {eventData.length} event
                                {eventData.length !== 1
                                    ? 's'
                                    : ''}{' '}
                                found
                            </p>

                            <button
                                onClick={handleDownloadCSV}
                                disabled={!eventData.length}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-500 cursor-pointer"
                            >
                                <i className="ri-download-2-line text-sm" />
                                Download CSV
                            </button>
                        </div>

                        <DataTable>
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                    <Th>Event Name</Th>
                                    <Th>Organising Club</Th>
                                    <Th>Registrations</Th>
                                    <Th>Event Date</Th>

                                    {role === 'admin' && (
                                        <Th>Type</Th>
                                    )}

                                    <Th align="right">
                                        Amount Received
                                    </Th>
                                </tr>
                            </thead>

                            <tbody>
                                {eventData.map(
                                    (item, idx) => (
                                        <tr
                                            key={
                                                item._id ||
                                                idx
                                            }
                                            className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                                        >
                                            <Td className="font-semibold text-black dark:text-white">
                                                {item.eventName}
                                            </Td>

                                            <Td className="text-orange-600 dark:text-orange-400 font-semibold">
                                                {item.clubName}
                                            </Td>

                                            <Td>
                                                {item.totalRegistrations ??
                                                    0}
                                            </Td>

                                            <Td className="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                                                {item.eventDate
                                                    ? new Date(
                                                          item.eventDate
                                                      ).toLocaleString(
                                                          undefined,
                                                          {
                                                              dateStyle:
                                                                  'medium',
                                                              timeStyle:
                                                                  'short'
                                                          }
                                                      )
                                                    : 'N/A'}
                                            </Td>

                                            {role ===
                                                'admin' && (
                                                <Td>
                                                    <TypeBadge
                                                        isPaid={
                                                            item.eventType ===
                                                            'Paid'
                                                        }
                                                    />
                                                </Td>
                                            )}

                                            <Td
                                                align="right"
                                                className="font-mono font-black text-base"
                                            >
                                                {Number(
                                                    item.totalAmountReceived
                                                ) > 0 ? (
                                                    <span className="text-orange-600 dark:text-orange-400">
                                                        ₹
                                                        {
                                                            item.totalAmountReceived
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-200 dark:text-neutral-700">
                                                        —
                                                    </span>
                                                )}
                                            </Td>
                                        </tr>
                                    )
                                )}

                                {eventData.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                role === 'admin'
                                                    ? 6
                                                    : 5
                                            }
                                            className="px-5 py-16 text-center text-neutral-400 text-sm"
                                        >
                                            No events found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </DataTable>
                    </div>
                )}

                {/* PROFILE */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        <div className="lg:col-span-2 space-y-6">
                            <form
                                onSubmit={handleUpdateProfile}
                                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 p-6 md:p-8 rounded-2xl shadow-sm space-y-6"
                            >
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Admin Details
                                </h2>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 tracking-wider mb-2">
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        disabled
                                        value={profileEmail}
                                        readOnly
                                        className="w-full px-4 py-2.5 border border-neutral-200 dark:border-zinc-800 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-neutral-400 outline-none text-sm font-medium"
                                    />

                                    <p className="text-[10px] text-neutral-400 mt-1">
                                        Contact system administrator to change your email.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 tracking-wider mb-2">
                                        Display Name
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        value={profileName}
                                        onChange={(e) =>
                                            setProfileName(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter display name"
                                        className="w-full px-4 py-2.5 border border-neutral-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-neutral-900 text-black dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm font-medium"
                                    />
                                </div>

                                <div className="pt-6 border-t border-neutral-100 dark:border-zinc-800">
                                    <label className="flex items-center justify-between p-4 bg-orange-50/30 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-900/40 rounded-xl cursor-pointer group hover:border-orange-500 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <i className="ri-shield-check-line text-2xl text-orange-600" />

                                            <div>
                                                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-200 tracking-tight">
                                                    2-Step Verification
                                                </p>

                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                    Requires an email OTP code every time you login.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    profile2FA
                                                }
                                                onChange={(e) =>
                                                    setProfile2FA(
                                                        e.target
                                                            .checked
                                                    )
                                                }
                                                className="sr-only peer"
                                            />

                                            <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
                                        </div>
                                    </label>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={
                                            isSavingProfile
                                        }
                                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSavingProfile
                                            ? 'Saving...'
                                            : 'Save Settings'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* CHANGE PASSWORD */}
                        <div>
                            <form
                                onSubmit={handleChangePassword}
                                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 p-6 md:p-8 rounded-2xl shadow-sm space-y-6"
                            >
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Change Password
                                </h2>

                                <PasswordInput
                                    label="Current Password"
                                    value={
                                        profilePasswordForm.currentPassword
                                    }
                                    onChange={(value) =>
                                        setProfilePasswordForm(
                                            {
                                                ...profilePasswordForm,
                                                currentPassword:
                                                    value
                                            }
                                        )
                                    }
                                    placeholder="Enter old password"
                                />

                                <PasswordInput
                                    label="New Password"
                                    value={
                                        profilePasswordForm.newPassword
                                    }
                                    onChange={(value) =>
                                        setProfilePasswordForm(
                                            {
                                                ...profilePasswordForm,
                                                newPassword:
                                                    value
                                            }
                                        )
                                    }
                                    placeholder="Min. 6 characters"
                                />

                                <PasswordInput
                                    label="Confirm New Password"
                                    value={
                                        profilePasswordForm.confirmPassword
                                    }
                                    onChange={(value) =>
                                        setProfilePasswordForm(
                                            {
                                                ...profilePasswordForm,
                                                confirmPassword:
                                                    value
                                            }
                                        )
                                    }
                                    placeholder="Confirm new password"
                                />

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={
                                            isSavingProfile
                                        }
                                        className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSavingProfile
                                            ? 'Saving...'
                                            : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* PAYOUT MODAL */}
                {modalOpen && selectedClub && (
                    <Modal
                        onClose={() => {
                            setModalOpen(false);
                            setSelectedClub(null);
                            setSelectedEventId(null);
                        }}
                        title="Settlement Info"
                        subtitle={
                            selectedClub.clubName
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <ModalField
                                label="Account Holder"
                                value={
                                    selectedClub.bankInfo
                                        ?.accountHolderName
                                }
                            />

                            <ModalField
                                label="Bank Name"
                                value={
                                    selectedClub.bankInfo
                                        ?.bankName
                                }
                            />

                            <ModalField
                                label="A/C Number"
                                value={
                                    selectedClub.bankInfo
                                        ?.accountNumber
                                }
                                mono
                            />

                            <ModalField
                                label="IFSC Code"
                                value={
                                    selectedClub.bankInfo
                                        ?.ifscCode
                                }
                                mono
                            />

                            <ModalField
                                label="UPI ID"
                                value={
                                    selectedClub.bankInfo
                                        ?.upiId
                                }
                                accent
                            />

                            <ModalField
                                label="Phone"
                                value={
                                    selectedClub.bankInfo
                                        ?.bankPhone
                                }
                            />
                        </div>

                        <div className="bg-neutral-50 dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-zinc-800 rounded-xl mt-6">
                            <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                                <i className="ri-hand-coin-line mr-2 text-black dark:text-white" />
                                Execute the transaction manually via your business banking portal, then mark as complete.
                            </p>
                        </div>

                        <button
                            className="w-full mt-6 py-3.5 bg-orange-600 text-white font-bold text-[11px] uppercase tracking-[0.15em] rounded-xl hover:bg-orange-500 transition-colors cursor-pointer"
                            onClick={handleConfirmPayout}
                        >
                            Confirm Payout
                        </button>
                    </Modal>
                )}

                {/* EDIT CLUB MODAL */}
                {isEditModalOpen && editingClub && (
                    <Modal
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setEditingClub(null);
                        }}
                        title="Edit Club"
                    >
                        <form
                            onSubmit={handleUpdateClub}
                            className="space-y-4"
                        >
                            <ModalFormField
                                label="Club Name"
                                name="clubName"
                                defaultValue={
                                    editingClub.clubName
                                }
                                required
                            />

                            <ModalFormField
                                label="Official Club Email"
                                name="clubEmail"
                                type="email"
                                defaultValue={
                                    editingClub.clubEmail
                                }
                                required
                            />

                            <ModalFormField
                                label="Faculty Name"
                                name="facultyName"
                                defaultValue={
                                    editingClub.facultyName
                                }
                                placeholder="Display name if no coordinator"
                            />

                            <ModalFormField
                                label="Faculty Email"
                                name="facultyEmail"
                                type="email"
                                defaultValue={
                                    editingClub.facultyEmail
                                }
                                placeholder="Legacy faculty email"
                            />

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
                                    Assign Faculty Coordinator
                                </label>

                                <select
                                    name="facultyCoordinatorId"
                                    defaultValue={
                                        editingClub.facultyCoordinators?.[0]?.id ||
                                        editingClub.facultyCoordinatorId ||
                                        ''
                                    }
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors"
                                >
                                    <option value="">
                                        None
                                    </option>

                                    {coordinators.map(
                                        (coordinator) => (
                                            <option
                                                key={
                                                    coordinator._id
                                                }
                                                value={
                                                    coordinator._id
                                                }
                                            >
                                                {
                                                    coordinator.name
                                                }{' '}
                                                (
                                                {
                                                    coordinator.email
                                                }
                                                )
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(
                                            false
                                        );
                                        setEditingClub(null);
                                    }}
                                    type="button"
                                    className="flex-1 py-3 border border-neutral-200 dark:border-zinc-800 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {/* EDIT COORDINATOR MODAL */}
                {isCoordModalOpen && editingCoord && (
                    <Modal
                        onClose={() => {
                            setIsCoordModalOpen(false);
                            setEditingCoord(null);
                        }}
                        title="Edit Coordinator"
                    >
                        <form
                            onSubmit={handleUpdateCoord}
                            className="space-y-4"
                        >
                            <ModalFormField
                                label="Full Name"
                                name="name"
                                defaultValue={
                                    editingCoord.name
                                }
                                required
                            />

                            <ModalFormField
                                label="Email Address"
                                name="email"
                                type="email"
                                defaultValue={
                                    editingCoord.email
                                }
                                required
                            />

                            <ModalFormField
                                label="New Password"
                                name="password"
                                type="password"
                                placeholder="Leave blank to keep current"
                            />

                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsCoordModalOpen(
                                            false
                                        );
                                        setEditingCoord(null);
                                    }}
                                    type="button"
                                    className="flex-1 py-3 border border-neutral-200 dark:border-zinc-800 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
        </div>
    );
};

// =============================================================
// SUB-COMPONENTS
// =============================================================

const StatCard = ({
    label,
    value,
    accent = false
}) => (
    <div
        className={`p-5 rounded-2xl border transition-colors ${
            accent
                ? 'bg-black dark:bg-white border-black dark:border-white'
                : 'bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-zinc-800'
        }`}
    >
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">
            {label}
        </p>

        <p
            className={`text-2xl font-black mt-1 ${
                accent
                    ? 'text-orange-500 dark:text-orange-600'
                    : 'text-black dark:text-white'
            }`}
        >
            {value}
        </p>
    </div>
);

const SummaryCard = ({
    label,
    value,
    color
}) => {
    const colorClasses = {
        amber: 'text-amber-500',
        emerald: 'text-emerald-500',
        rose: 'text-rose-500',
        orange: 'text-orange-500'
    };

    return (
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-zinc-800 transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">
                {label}
            </p>

            <p
                className={`text-2xl font-black mt-1 ${
                    colorClasses[color] ||
                    'text-black dark:text-white'
                }`}
            >
                {value}
            </p>
        </div>
    );
};

const PasswordInput = ({
    label,
    value,
    onChange,
    placeholder
}) => (
    <div>
        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 tracking-wider mb-2">
            {label}
        </label>

        <input
            type="password"
            required
            value={value}
            onChange={(e) =>
                onChange(e.target.value)
            }
            placeholder={placeholder}
            className="w-full px-4 py-2.5 border border-neutral-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-neutral-900 text-black dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm font-medium"
        />
    </div>
);

const DataTable = ({ children }) => (
    <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full">
                {children}
            </table>
        </div>
    </div>
);

const Th = ({
    children,
    align = 'left'
}) => (
    <th
        className={`px-5 py-4 text-${align} text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500`}
    >
        {children}
    </th>
);

const Td = ({
    children,
    align = 'left',
    className = ''
}) => (
    <td
        className={`px-5 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300 text-${align} ${className}`}
    >
        {children}
    </td>
);

const TypeBadge = ({
    isPaid,
    fee
}) => (
    <span
        className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
            isPaid
                ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20'
                : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20'
        }`}
    >
        {isPaid
            ? fee
                ? `Paid (₹${fee})`
                : 'Paid'
            : 'Free'}
    </span>
);

const FormInput = ({
    name,
    type = 'text',
    placeholder,
    required = false
}) => (
    <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-400 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors placeholder:text-neutral-500 dark:placeholder:text-neutral-600"
    />
);

const FilterSelect = ({
    children,
    value,
    onChange
}) => (
    <select
        value={value}
        onChange={(e) =>
            onChange(e.target.value)
        }
        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[12px] font-bold text-neutral-600 dark:text-neutral-300 focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors cursor-pointer"
    >
        {children}
    </select>
);

const Modal = ({
    onClose,
    title,
    subtitle,
    children
}) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
    >
        <div
            className="bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) =>
                e.stopPropagation()
            }
        >
            <div className="px-6 pt-6 pb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-black text-black dark:text-white tracking-tight">
                        {title}
                    </h3>

                    {subtitle && (
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold mt-0.5 tracking-wide">
                            {subtitle}
                        </p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                    <i className="ri-close-line text-lg" />
                </button>
            </div>

            <div className="px-6 pb-6">
                {children}
            </div>
        </div>
    </div>
);

const ModalField = ({
    label,
    value,
    mono = false,
    accent = false
}) => (
    <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
            {label}
        </label>

        <p
            className={`font-semibold text-sm border-b border-neutral-200 dark:border-zinc-800 pb-1.5 ${
                mono ? 'font-mono' : ''
            } ${
                accent
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-black dark:text-white'
            }`}
        >
            {value || 'N/A'}
        </p>
    </div>
);

const ModalFormField = ({
    label,
    name,
    type = 'text',
    defaultValue = '',
    placeholder,
    required = false
}) => (
    <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
            {label}
        </label>

        <input
            name={name}
            type={type}
            defaultValue={defaultValue}
            placeholder={placeholder}
            required={required}
            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors"
        />
    </div>
);

export default AdminDashboard;