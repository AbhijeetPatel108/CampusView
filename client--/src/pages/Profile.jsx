import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

const Profile = () => {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isClubAdded, setIsClubAdded] = useState(false);

    // Registered Events state
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsFetched, setEventsFetched] = useState(false);
    const eventsSectionRef = useRef(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const storedRole = localStorage.getItem('role');
        if (storedUser) {
            setUser(storedUser);
            setRole(storedRole);

            const userId = storedUser._id || storedUser.id;
            if (userId) {
                setEventsLoading(true);
                axios.get(`${API_URL}/api/events/user/${userId}`)
                    .then(res => {
                        setRegisteredEvents(Array.isArray(res.data) ? res.data : []);
                    })
                    .catch(err => {
                        console.error("Error fetching registered events:", err);
                    })
                    .finally(() => {
                        setEventsLoading(false);
                        setEventsFetched(true);
                    });
            }

            if (storedRole === 'club' && storedUser.clubId) {
                axios.get(`${API_URL}/api/clubs/${storedUser.clubId}`)
                    .then(res => {
                        const club = res.data.club;
                        if (club && (club.description || club.clubLogo || club.category)) {
                            setIsClubAdded(true);
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching club details in Profile.jsx:", err);
                    });
            }
        }
        setLoading(false);
    }, []);

    // Auto-scroll to events section if URL is /my-events
    useEffect(() => {
        if (location.pathname === '/my-events' && eventsSectionRef.current) {
            setTimeout(() => {
                eventsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    }, [location.pathname, eventsFetched]);

    const scrollToEvents = () => {
        if (eventsSectionRef.current) {
            eventsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!user) return <div className="text-center mt-10">Please login to view profile.</div>;
    if (loading) return <div className="text-center mt-10">Loading profile...</div>;

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">

            {/* Profile Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 md:p-8 mb-12 shadow-sm">
                <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 mb-8">
                    Profile
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-neutral-700">
                    <div>
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Name</p>
                        <p className="font-semibold text-lg text-neutral-800">{user.name || user.fullName}</p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Email</p>
                        <p className="font-semibold text-lg text-neutral-800 break-all">
                            {user.email}
                        </p>
                    </div>

                    {(role === 'member' || role === 'student') && (
                        <>
                            <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Roll No</p>
                                <p className="font-semibold text-neutral-800">{user.rollNo || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Branch / Year</p>
                                <p className="font-semibold text-neutral-800">
                                    {user.branch || 'N/A'} - {user.year || 'N/A'}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {(!['member', 'student'].includes(role)) && !user.isTwoStepEnabled && (
                    <p className='text-neutral-600 mt-6 text-sm font-medium'> <i className="ri-error-warning-line mr-1 text-orange-500" /> Two Factor Authentication is disabled <Link to="/profile/edit" className="font-semibold text-orange-600 hover:underline">Enable it</Link></p>
                )}

                <div className="mt-8 pt-6 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Social Profiles</h3>
                        <div className="flex flex-wrap gap-2.5">
                            {user.githubProfile && (
                                <a href={user.githubProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-orange-500/50 transition-colors shadow-sm">
                                    <i className="ri-github-fill text-lg text-neutral-800" /> GitHub
                                </a>
                            )}
                            {user.linkedinProfile && (
                                <a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-neutral-50 hover:border-blue-500/50 transition-colors shadow-sm">
                                    <i className="ri-linkedin-box-fill text-lg" /> LinkedIn
                                </a>
                            )}
                            {user.xProfile && (
                                <a href={user.xProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-900 hover:bg-neutral-50 hover:border-neutral-800/50 transition-colors shadow-sm">
                                    <i className="ri-twitter-x-fill text-lg" /> X
                                </a>
                            )}
                            {user.instagramProfile && (
                                <a href={user.instagramProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-pink-600 hover:bg-neutral-50 hover:border-pink-500/50 transition-colors shadow-sm">
                                    <i className="ri-instagram-line text-lg" /> Instagram
                                </a>
                            )}
                            {user.whatsappNumber && (
                                <a href={`https://wa.me/${user.whatsappNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-green-600 hover:bg-neutral-50 hover:border-green-500/50 transition-colors shadow-sm">
                                    <i className="ri-whatsapp-line text-lg" /> WhatsApp
                                </a>
                            )}
                            {user.portfolioUrl && (
                                <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-orange-600 hover:bg-neutral-50 hover:border-orange-500/50 transition-colors shadow-sm">
                                    <i className="ri-global-line text-lg" /> Portfolio
                                </a>
                            )}
                            {!user.githubProfile && !user.linkedinProfile && !user.xProfile && !user.instagramProfile && !user.whatsappNumber && !user.portfolioUrl && (
                                <p className="text-xs text-neutral-400 italic font-medium">No social profiles added.</p>
                            )}
                        </div>
                    </div>
                    <div className="flex md:justify-end">
                        <a href="/profile/edit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold text-xs shadow-sm cursor-pointer">
                            <i className="ri-edit-line text-sm" /> Edit Profile
                        </a>
                    </div>
                </div>
            </div>

            {/* Quick Action Links */}
            {(role === 'member' || role === 'student') && (
                <div className="mb-12">
                    <button
                        onClick={scrollToEvents}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-orange-600 transition-colors shadow-sm cursor-pointer"
                    >
                        <i className="ri-calendar-event-line text-sm" /> View My Events ({registeredEvents.length})
                    </button>
                </div>
            )}

            {(role === 'club') && (
                <div className="mb-12 flex flex-wrap gap-4">
                    <button
                        onClick={scrollToEvents}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-orange-600 transition-colors shadow-sm cursor-pointer"
                    >
                        <i className="ri-calendar-event-line text-sm" /> My Events ({registeredEvents.length})
                    </button>
                    <Link
                        to="/payments"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-colors shadow-sm cursor-pointer"
                    >
                        <i className="ri-money-dollar-circle-line text-sm" /> Payment Tracking
                    </Link>
                    <Link
                        to={`/club/edit/${user.clubId || user.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-colors shadow-sm cursor-pointer"
                    >
                        <i className="ri-community-line text-sm" /> {!isClubAdded ? "Add Club on Website" : "Edit Club Details"}
                    </Link>
                </div>
            )}

            {/* Registered Events Section */}
            <div ref={eventsSectionRef} className="pt-4 scroll-mt-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 flex items-center gap-2">
                        <i className="ri-calendar-check-line text-orange-600" /> My Registered Events
                    </h2>
                    <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
                        {registeredEvents.length} Event{registeredEvents.length === 1 ? '' : 's'}
                    </span>
                </div>

                {eventsLoading ? (
                    <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
                        <p className="text-neutral-500 font-medium">Loading your registered events...</p>
                    </div>
                ) : registeredEvents.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl p-8">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                            <i className="ri-calendar-event-line" />
                        </div>
                        <h3 className="text-base font-bold text-neutral-800 mb-1">No Registered Events Found</h3>
                        <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
                            You haven't registered for any events yet. Check out the upcoming events on campus!
                        </p>
                        <Link
                            to="/events"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-orange-700 transition shadow-sm"
                        >
                            Explore Events <i className="ri-arrow-right-line" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {registeredEvents.map((evt) => {
                            const userId = user._id || user.id;
                            const userReg = evt.registrations?.find(r => r.userId === userId || String(r.userId) === String(userId));
                            const regStatus = userReg?.status || "REGISTERED";
                            const eventSlug = evt.slug || evt._id;

                            return (
                                <Link
                                    key={evt._id || evt.id}
                                    to={`/event/${eventSlug}`}
                                    className="group bg-white border border-neutral-200 hover:border-orange-500 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row"
                                >
                                    {/* Event Image */}
                                    <div className="md:w-1/3 aspect-video md:aspect-auto relative bg-neutral-100 overflow-hidden">
                                        <img
                                            src={evt.imageUrl || "/CLUBSETU.png"}
                                            alt={evt.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/CLUBSETU.png";
                                            }}
                                        />
                                        <span className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            regStatus === 'WAITLISTED'
                                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                : 'bg-green-100 text-green-800 border border-green-300'
                                        }`}>
                                            {regStatus}
                                        </span>
                                    </div>

                                    {/* Event Content */}
                                    <div className="p-5 md:w-2/3 flex flex-col justify-between">
                                        <div>
                                            <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-1">
                                                {evt.club?.clubName || evt.createdBy?.clubName || 'Campus Event'}
                                            </p>
                                            <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-2">
                                                {evt.title}
                                            </h3>
                                            
                                            <div className="space-y-1 text-xs text-neutral-600 font-medium mb-4">
                                                <p className="flex items-center gap-1.5">
                                                    <i className="ri-time-line text-neutral-400 text-sm" />
                                                    {new Date(evt.startTime).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <i className="ri-map-pin-line text-neutral-400 text-sm" />
                                                    {evt.venue || 'TBA'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 mt-auto">
                                            <span className="text-xs font-bold text-neutral-800">
                                                {evt.entryFee ? `₹${evt.entryFee}` : 'Free'}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
                                                View Event <i className="ri-arrow-right-line" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bank Information section - Restored for Club Account */}
            {(role === 'club') && (
                <div className="mt-12 p-6 md:p-8 bg-white border border-neutral-200 rounded-xl shadow-sm">
                    <h2 className="text-lg font-bold text-neutral-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <i className="ri-bank-card-line text-orange-600" /> Bank / Payment Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-neutral-600 bg-neutral-50/50 p-6 rounded-xl border border-neutral-200">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Bank Name</p>
                            <p className="font-semibold text-neutral-800">{user.bankName || 'Not Set'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Account Holder</p>
                            <p className="font-semibold text-neutral-800">{user.accountHolderName || 'Not Set'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Account Number</p>
                            <p className="font-mono font-semibold text-neutral-800">{user.accountNumber || 'Not Set'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">IFSC Code</p>
                            <p className="font-mono font-semibold text-neutral-800">{user.ifscCode || 'Not Set'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">UPI ID</p>
                            <p className="font-semibold text-orange-600">{user.upiId || 'Not Set'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Linked Phone</p>
                            <p className="font-semibold text-neutral-800">{user.bankPhone || 'Not Set'}</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Profile;