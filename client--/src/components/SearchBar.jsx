import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";


// Static pages that are always searchable
const STATIC_PAGES = [
    { title: "Home", path: "/", type: "page", icon: "ri-home-4-line" },
    { title: "Clubs", path: "/clubs", type: "page", icon: "ri-team-line" },
    { title: "Events", path: "/events", type: "page", icon: "ri-calendar-event-line" },
    { title: "Team", path: "/team", type: "page", icon: "ri-group-line" },
    { title: "Contribute", path: "/contribute", type: "page", icon: "ri-heart-line" },
    { title: "About & Features", path: "/about-features", type: "page", icon: "ri-information-line" },
    { title: "FAQ", path: "/faq", type: "page", icon: "ri-question-line" },
    { title: "Event Guide", path: "/event-guide", type: "page", icon: "ri-book-open-line" },
    { title: "Privacy Policy", path: "/privacy", type: "page", icon: "ri-shield-line" },
    { title: "Terms & Conditions", path: "/terms", type: "page", icon: "ri-file-list-line" },
    { title: "Payment Policy", path: "/payment-policy", type: "page", icon: "ri-money-dollar-circle-line" },
    { title: "Data Privacy", path: "/data-privacy", type: "page", icon: "ri-lock-line" },
    { title: "Login", path: "/login", type: "page", icon: "ri-login-box-line" },
    { title: "Register", path: "/register/student", type: "page", icon: "ri-user-add-line" },
    { title: "Profile", path: "/profile", type: "page", icon: "ri-user-line" },
    { title: "My Events", path: "/my-events", type: "page", icon: "ri-calendar-check-line" },
    { title: "Notifications", path: "/notifications", type: "page", icon: "ri-notification-3-line" },
];



const SearchBar = ({ isOpen, onClose, isMobile = false }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const navigate = useNavigate();

    // Fetch clubs and events once when search opens
    useEffect(() => {
        if (isOpen && !hasFetched) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [clubsRes, eventsRes] = await Promise.all([
                        axios.get(`${API_URL}/api/clubs`),
                        axios.get(`${API_URL}/api/events`),
                    ]);
                    setClubs(clubsRes.data || []);
                    setEvents(eventsRes.data || []);
                    setHasFetched(true);
                } catch (err) {
                    console.error("Search data fetch error:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, hasFetched]);

    // Focus input when search opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            const timer = setTimeout(() => inputRef.current?.focus(), 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Reset query when closed
    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);


    // Filter results based on query
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const q = query.toLowerCase().trim();
        const matched = [];


        // Search clubs
        clubs.forEach((club) => {
            if (
                club.clubName?.toLowerCase().includes(q) ||
                club.category?.toLowerCase().includes(q) ||
                club.description?.toLowerCase().includes(q)
            ) {
                matched.push({
                    title: club.clubName,
                    subtitle: club.category || "Club",
                    path: `/club/${club.slug || club._id}`,
                    type: "club",
                    icon: "ri-team-line",
                    logo: club.clubLogo,
                });
            }
        });

        // Search events
        events.forEach((event) => {
            if (
                event.title?.toLowerCase().includes(q) ||
                event.venue?.toLowerCase().includes(q) ||
                event.club?.clubName?.toLowerCase().includes(q)
            ) {
                matched.push({
                    title: event.title,
                    subtitle: event.club?.clubName || "Event",
                    path: `/event/${event.slug || event._id}`,
                    type: "event",
                    icon: "ri-calendar-event-line",
                    image: event.imageUrl,
                });
            }
        });

        // Search static pages
        STATIC_PAGES.forEach((page) => {
            if (page.title.toLowerCase().includes(q)) {
                matched.push({
                    title: page.title,
                    subtitle: "Page",
                    path: page.path,
                    type: "page",
                    icon: page.icon,
                });
            }
        });


        // Special case: Developer search
        if (q.includes("nikhil") || q.includes("Nikhil") || q.includes("nik") || q.includes("Nik") || q.includes("yadav") || q.includes("Yadav") || q.includes("n")) {
            matched.push({
                title: "Nikhil Yadav",
                subtitle: "Lead Developer of CampusNode",
                path: "/team",
                type: "developer",
                icon: "ri-code-s-slash-line",
            });
        }

        setResults(matched.slice(0, 8));
    }, [query, clubs, events]);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            onClose();
        } else if (e.key === "Enter" && results.length > 0) {
            navigate(results[0].path);
            onClose();
        }
    };

    const handleResultClick = () => {
        onClose();
    };

    const typeLabel = (type) => {
        switch (type) {
            case "club": return "Club";
            case "event": return "Event";
            case "page": return "Page";
            case "developer": return "Dev";
            default: return "";
        }
    };

    const typeBadgeColor = (type) => {
        switch (type) {
            case "club": return "bg-blue-50 text-blue-600 border-blue-200";
            case "event": return "bg-orange-50 text-orange-600 border-orange-200";
            case "page": return "bg-neutral-100 text-neutral-600 border-neutral-200";
            case "developer": return "bg-purple-50 text-purple-600 border-purple-200";
            default: return "";
        }
    };

    const renderResults = () => {
        if (!isOpen || !query.trim()) return null;
        return (
            <div ref={resultsRef} className="search-results">
                {loading ? (
                    <div className="search-loading">
                        <div className="search-loading-spinner" />
                        <span>Searching...</span>
                    </div>
                ) : results.length > 0 ? (
                    <>
                        <div className="search-results-header">
                            <span>{results.length} result{results.length !== 1 ? "s" : ""} found</span>
                        </div>
                        {results.map((result, idx) => (
                            <Link
                                key={`${result.type}-${idx}`}
                                to={result.path}
                                onClick={handleResultClick}
                                className="search-result-item"
                            >
                                <div className="search-result-icon-wrapper">
                                    {result.logo ? (
                                        <img src={result.logo} alt="" className="search-result-logo" />
                                    ) : result.image ? (
                                        <img src={result.image} alt="" className="search-result-logo" />
                                    ) : (
                                        <i className={`${result.icon} search-result-icon`} />
                                    )}
                                </div>
                                <div className="search-result-content">
                                    <span className="search-result-title">{result.title}</span>
                                    <span className="search-result-subtitle">{result.subtitle}</span>
                                </div>
                                <span className={`search-result-badge ${typeBadgeColor(result.type)}`}>
                                    {typeLabel(result.type)}
                                </span>
                                <i className="ri-arrow-right-up-line search-result-arrow" />
                            </Link>
                        ))}
                    </>
                ) : (
                    <div className="search-no-results">
                        <i className="ri-search-line search-no-results-icon" />
                        <p className="search-no-results-text">No results for "{query}"</p>
                        <p className="search-no-results-hint">Try searching for a club name, event, or page</p>
                    </div>
                )}
            </div>
        );
    };

    // Mobile: results inside the container (no overflow issue)
    // Desktop: results OUTSIDE the overflow-hidden container as a sibling
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-xl bg-white border-2 border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input Bar */}
                <div className="flex items-center px-4 py-3.5 border-b border-neutral-100 bg-white">
                    <i className="ri-search-line text-neutral-400 text-lg mr-3 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search clubs, events, pages..."
                        className="w-full bg-transparent text-sm font-medium text-black placeholder:text-neutral-400 outline-none"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="p-1 text-neutral-400 hover:text-black transition-colors mr-2 cursor-pointer"
                            aria-label="Clear search"
                        >
                            <i className="ri-close-line text-lg" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-2 py-1 text-[10px] font-mono font-bold bg-neutral-100 text-neutral-500 rounded border border-neutral-200 hover:bg-neutral-200 transition-colors cursor-pointer"
                        aria-label="Close search"
                    >
                        ESC
                    </button>
                </div>

                {/* Results Section */}
                {query.trim() !== "" && (
                    <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto divide-y divide-neutral-100 bg-white">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-400 font-medium">
                                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                <span>Searching...</span>
                            </div>
                        ) : results.length > 0 ? (
                            <>
                                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50">
                                    {results.length} result{results.length !== 1 ? "s" : ""} found
                                </div>
                                {results.map((result, idx) => (
                                    <Link
                                        key={`${result.type}-${idx}`}
                                        to={result.path}
                                        onClick={handleResultClick}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50/60 transition-colors group cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden">
                                            {result.logo ? (
                                                <img src={result.logo} alt="" className="w-full h-full object-cover" />
                                            ) : result.image ? (
                                                <img src={result.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <i className={`${result.icon} text-lg text-neutral-600`} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-black truncate group-hover:text-orange-600 transition-colors">
                                                {result.title}
                                            </div>
                                            <div className="text-xs text-neutral-400 truncate">
                                                {result.subtitle}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${typeBadgeColor(result.type)}`}>
                                            {typeLabel(result.type)}
                                        </span>
                                        <i className="ri-arrow-right-up-line text-neutral-300 group-hover:text-orange-600 transition-colors text-base" />
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <div className="py-12 text-center px-4">
                                <i className="ri-search-line text-3xl text-neutral-300 mb-2 block" />
                                <p className="text-sm font-bold text-black mb-1">No results for "{query}"</p>
                                <p className="text-xs text-neutral-400">Try searching for a club name, event, or page</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchBar;