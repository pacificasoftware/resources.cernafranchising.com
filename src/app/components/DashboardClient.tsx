
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 

type Section =
    | "Dashboard"
    | "Onboarding"
    | "Resources"
    | "Support Tickets"
    | "Training"
    | "Announcements";

type PortalUser = {
    adminUserId?: number | string | null;
    fullName?: string;
    email?: string;
    roleId?: number | string | null;
    roleName?: string;
    locationId?: number | string | null;
    locationName?: string;
    avatarUrl?: string;
};

const resourceCategories = [
    {
        title: "Operations",
        category: "Operations",
        description: "Franchise owner guidance, technology, scheduling, billing, payroll and contracts.",
        type: "Category",
        href: "/resources/operations",
        icon: "⚙",
    },
    {
        title: "Sales & Marketing",
        category: "Sales & Marketing",
        description: "Sales tools, templates, videos, brand standards and local marketing.",
        type: "Category",
        href: "/resources/sales-marketing",
        icon: "◈",
    },
    {
        title: "HR/Recruiting",
        category: "HR/Recruiting",
        description: "Hiring procedures, job descriptions, verification and interview resources.",
        type: "Category",
        href: "/resources/hr-recruiting",
        icon: "♧",
    },
    {
        title: "Clinical/Compliance",
        category: "Clinical/Compliance",
        description: "Clinical reference materials, nutrition and disease-specific guidance.",
        type: "Category",
        href: "/resources/clinical-compliance",
        icon: "✚",
    },
];

const resources = resourceCategories;

const tickets = [
    {
        number: "CER-1042",
        subject: "Unable to access recruiting dashboard",
        status: "In Progress",
        priority: "High",
    },
    {
        number: "CER-1041",
        subject: "Request for marketing materials",
        status: "Open",
        priority: "Normal",
    },
    {
        number: "CER-1038",
        subject: "Question regarding client onboarding",
        status: "Resolved",
        priority: "Normal",
    },
];

const trainingModules = [
    {
        title: "New Franchise Orientation",
        category: "Onboarding",
        progress: 100,
    },
    {
        title: "Cerna Client Intake Process",
        category: "Operations",
        progress: 60,
    },
    {
        title: "Recruiting Best Practices",
        category: "Human Resources",
        progress: 0,
    },
];

const announcements = [
    {
        title: "Welcome to the Franchise Resource Center",
        category: "Corporate Update",
        description:
            "Access important franchise resources, operational materials and corporate support in one place.",
    },
    {
        title: "Updated Franchise Operations Handbook",
        category: "Operations",
        description:
            "The updated operations handbook will be available through the resource library.",
    },
    {
        title: "New Caregiver Recruitment Resources",
        category: "Human Resources",
        description:
            "New recruiting materials and onboarding guides are being prepared for franchise locations.",
    },
];

const navigation: {
    name: Section;
    icon: string;
}[] = [
        { name: "Dashboard", icon: "▦" },
        { name: "Onboarding", icon: "✓" },
        { name: "Resources", icon: "▤" },
        { name: "Support Tickets", icon: "◫" },
        { name: "Training", icon: "◈" },
        { name: "Announcements", icon: "◉" },
    ];

export default function DashboardClient() {
    const router = useRouter();

    const [ready, setReady] = useState(false);
    const [user, setUser] = useState<PortalUser | null>(null);
    const [avatarError, setAvatarError] = useState(false);
    const [section, setSection] =
        useState<Section>("Dashboard");

    const [search, setSearch] = useState("");
    const [mobileMenu, setMobileMenu] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // --------------------------------------------------
    // LOAD USER DISPLAY INFORMATION
    // Authentication is checked by the server page.
    // This data is only used for display.
    // --------------------------------------------------

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem(
                "cerna_portal_user"
            );

            if (storedUser) {
                const parsedUser: PortalUser =
                    JSON.parse(storedUser);

                setUser(parsedUser);
            }
        } catch (error) {
            console.error(
                "Unable to read portal user:",
                error
            );

            localStorage.removeItem("cerna_portal_user");
        } finally {
            setReady(true);
        }
    }, []);

    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------

    async function logout() {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin",
                cache: "no-store",
            });

            const responseText = await response.text();

            console.log("LOGOUT DEBUG:", {
                url: response.url,
                status: response.status,
                contentType: response.headers.get("content-type"),
                responsePreview: responseText.slice(0, 300),
            });

            if (!response.ok) {
                throw new Error(
                    `Logout failed with HTTP ${response.status}`
                );
            }

            localStorage.removeItem("cerna_portal_user");
            sessionStorage.removeItem("cerna_demo_user");

            router.replace("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);

            alert(
                error instanceof Error
                    ? error.message
                    : "Unable to sign out."
            );
        } finally {
            setLoggingOut(false);
        }
    }

    // --------------------------------------------------
    // NAVIGATION
    // --------------------------------------------------

    function navigate(name: Section) {
        setMobileMenu(false);
        setSearch("");

        if (name === "Onboarding") {
            router.push("/onboarding");
            return;
        }

        setSection(name);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    // --------------------------------------------------
    // FILTER RESOURCES
    // --------------------------------------------------

    const filteredResources = resources.filter(
        (resource) =>
            `${resource.title} ${resource.category} ${resource.description}`
                .toLowerCase()
                .includes(search.toLowerCase())
    );

    const openTicketCount = tickets.filter(
        (ticket) => ticket.status !== "Resolved"
    ).length;

    const displayName =
        user?.fullName?.trim() || "Franchise Member";

    const displayEmail =
        user?.email?.trim() || "";

    const displayLocation =
        user?.locationName?.trim() || "Cerna Home Care";

    const initials =
        displayName === "Franchise Member"
            ? "CF"
            : displayName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join("")
                .toUpperCase();

    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------

    if (!ready) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#112E46]" />
                    <p className="text-sm text-slate-500">
                        Opening Cerna Franchise Portal...
                    </p>
                </div>
            </div>
        );
    }

    // --------------------------------------------------
    // MAIN LAYOUT
    // --------------------------------------------------

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-slate-800">
            {/* MOBILE OVERLAY */}

            {mobileMenu && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setMobileMenu(false)}
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                />
            )}

            {/* SIDEBAR */}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#112E46] text-white transition-transform lg:translate-x-0 ${mobileMenu
                        ? "translate-x-0"
                        : "-translate-x-full"
                    }`}
            >
                {/* Brand */}

                <div className="border-b border-white/10 px-6 py-7">
                    <div className="text-xl font-bold tracking-[0.12em]">
                        CERNA
                    </div>

                    <div className="mt-1 text-[10px] tracking-[0.22em] text-slate-300">
                        HOME CARE
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-5 text-xs font-medium text-slate-300">
                        FRANCHISE RESOURCE CENTER
                    </div>
                </div>

                {/* Navigation */}

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
                    {navigation.map((item) => (
                        <button
                            key={item.name}
                            type="button"
                            onClick={() => navigate(item.name)}
                            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${section === item.name
                                    ? "bg-white/15 font-semibold text-white"
                                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <span className="w-6 text-center text-lg">
                                {item.icon}
                            </span>

                            <span>{item.name}</span>
                        </button>
                    ))}
                </nav>

                {/* Sidebar Footer */}

                <div className="border-t border-white/10 p-5">
                    <div className="mb-4">
                        <p className="truncate text-sm font-semibold">
                            {displayLocation}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            {user?.roleName || "Franchise Location"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        disabled={loggingOut}
                        className="w-full rounded-lg border border-white/20 px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loggingOut ? "Signing Out..." : "Sign Out"}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}

            <div className="min-h-screen lg:pl-64">
                {/* HEADER */}

                <header className="sticky top-0 z-20 flex min-h-18 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-sm md:px-9">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-3 py-2 lg:hidden"
                            onClick={() =>
                                setMobileMenu(!mobileMenu)
                            }
                            aria-label="Toggle navigation"
                        >
                            ☰
                        </button>

                        <div>
                            <h1 className="text-lg font-semibold">
                                {section}
                            </h1>

                            <p className="text-xs text-slate-400">
                                Cerna Franchise Portal
                            </p>
                        </div>
                    </div>

                    {/* Logged In User */}

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium">
                                {displayName}
                            </p>

                            <p className="max-w-60 truncate text-xs text-slate-400">
                                {displayEmail}
                            </p>
                        </div>




                        {/* User Profile Image */}
                        <div
                            style={{
                                width: "44px",
                                height: "44px",
                                minWidth: "44px",
                                minHeight: "44px",
                                maxWidth: "44px",
                                maxHeight: "44px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                flexShrink: 0,
                                border: "2px solid #C6A267",
                                backgroundColor: "#112E46",
                            }}
                        >
                            {user?.avatarUrl && !avatarError ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={`${displayName}'s profile`}
                                    width={44}
                                    height={44}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        objectFit: "cover",
                                        objectPosition: "center",
                                    }}
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#FFFFFF",
                                        fontSize: "14px",
                                        fontWeight: 700,
                                    }}
                                >
                                    {initials}
                                </div>
                            )}
                        </div>



                    </div>
                </header>

                {/* PAGE BODY */}

                <main className="mx-auto max-w-7xl space-y-7 px-5 py-8 md:px-9">
                    {/* =================================== */}
                    {/* DASHBOARD */}
                    {/* =================================== */}

                    {section === "Dashboard" && (
                        <>
                            {/* Welcome */}

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B28B4E]">
                                    Franchise Resource Center
                                </p>

                                <h2 className="mt-2 text-2xl font-bold md:text-3xl">
                                    Welcome to your Cerna Portal
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Your central hub for franchise resources,
                                    operational guidance and corporate support.
                                </p>
                            </div>

                            {/* Stats */}

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {[
                                    {
                                        label: "Available Resources",
                                        count: resources.length,
                                        icon: "▤",
                                    },
                                    {
                                        label: "Open Support Tickets",
                                        count: openTicketCount,
                                        icon: "◫",
                                    },
                                    {
                                        label: "Training Modules",
                                        count: trainingModules.length,
                                        icon: "◈",
                                    },
                                    {
                                        label: "New Announcements",
                                        count: announcements.length,
                                        icon: "◉",
                                    },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="mb-4 text-2xl text-[#B28B4E]">
                                            {stat.icon}
                                        </div>

                                        <p className="text-3xl font-bold">
                                            {stat.count}
                                        </p>

                                        <p className="mt-2 text-sm text-slate-500">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Access + Announcements */}

                            <div className="grid gap-6 xl:grid-cols-3">
                                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                                    <h3 className="mb-5 text-lg font-semibold">
                                        Quick Access
                                    </h3>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        {[
                                            {
                                                title: "Resource Library",
                                                description:
                                                    "View manuals and guides",
                                                target: "Resources" as Section,
                                                icon: "▤",
                                            },
                                            {
                                                title: "Get Support",
                                                description:
                                                    "View support requests",
                                                target: "Support Tickets" as Section,
                                                icon: "◫",
                                            },
                                            {
                                                title: "Training Center",
                                                description:
                                                    "Learning materials",
                                                target: "Training" as Section,
                                                icon: "◈",
                                            },
                                        ].map((item) => (
                                            <button
                                                key={item.title}
                                                type="button"
                                                onClick={() =>
                                                    navigate(item.target)
                                                }
                                                className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-[#B28B4E] hover:bg-white"
                                            >
                                                <div className="mb-4 text-2xl text-[#B28B4E]">
                                                    {item.icon}
                                                </div>

                                                <p className="font-semibold">
                                                    {item.title}
                                                </p>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    {item.description}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold">
                                        Corporate Announcements
                                    </h3>

                                    <div className="mt-5 rounded-lg bg-[#F5F7FA] p-4">
                                        <span className="text-xs font-semibold text-[#B28B4E]">
                                            LATEST UPDATE
                                        </span>

                                        <p className="mt-2 text-sm font-semibold">
                                            {announcements[0].title}
                                        </p>

                                        <p className="mt-2 text-xs leading-5 text-slate-500">
                                            {announcements[0].description}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate("Announcements")
                                            }
                                            className="mt-4 text-xs font-semibold text-[#B28B4E]"
                                        >
                                            View Announcements →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Resources */}

                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-lg font-semibold">
                                        Resource Categories
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate("Resources")
                                        }
                                        className="text-sm font-semibold text-[#B28B4E]"
                                    >
                                        View All Resources →
                                    </button>
                                </div>

                                <div className="mt-4 divide-y divide-slate-100">
                                    {resources.slice(0, 3).map((resource) => (
                                        <div
                                            key={resource.title}
                                            className="flex items-center justify-between gap-4 py-4"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    {resource.title}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {resource.category}
                                                </p>
                                            </div>

                                            <span className="rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                                {resource.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* =================================== */}
                    {/* RESOURCE LIBRARY */}
                    {/* =================================== */}

                    {section === "Resources" && (
                        <>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B28B4E]">
                                    Knowledge Base
                                </p>

                                <h2 className="mt-2 text-2xl font-bold">
                                    Resource Library
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Choose a category to browse franchise manuals,
                                    templates, procedures and guides.
                                </p>
                            </div>

                            <input
                                type="search"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search resource categories..."
                                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 outline-none transition focus:border-[#B28B4E]"
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                {filteredResources.map((resource) => (
                                    <button
                                        key={resource.title}
                                        type="button"
                                        onClick={() => router.push(resource.href)}
                                        className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-[#B28B4E] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B28B4E]"
                                    >
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[#B28B4E]">
                                            {resource.category}
                                        </span>

                                        <h3 className="mt-3 font-semibold">
                                            {resource.title}
                                        </h3>

                                        <p className="mt-2 text-sm text-slate-500">
                                            {resource.description}
                                        </p>

                                        <div className="mt-5 flex items-center justify-between">
                                            <span className="text-xs text-slate-400">
                                                {resource.type}
                                            </span>

                                            <span className="text-xs font-semibold text-[#B28B4E]">
                                                Open Category →
                                            </span>
                                        </div>
                                    </button>
                                ))}

                                {filteredResources.length === 0 && (
                                    <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center">
                                        <p className="text-sm text-slate-500">
                                            No resources match your search.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* =================================== */}
                    {/* SUPPORT TICKETS */}
                    {/* =================================== */}

                    {section === "Support Tickets" && (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B28B4E]">
                                        Corporate Support
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold">
                                        Support Tickets
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        View and manage requests submitted to
                                        Cerna corporate.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled
                                    title="Ticket submission will be available when the API is connected."
                                    className="cursor-not-allowed rounded-lg bg-[#112E46] px-5 py-3 text-sm font-semibold text-white opacity-60"
                                >
                                    + New Ticket — Coming Soon
                                </button>
                            </div>

                            {/* Ticket Summary */}

                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    {
                                        label: "Total Tickets",
                                        count: tickets.length,
                                    },
                                    {
                                        label: "Open / In Progress",
                                        count: openTicketCount,
                                    },
                                    {
                                        label: "Resolved",
                                        count: tickets.filter(
                                            (ticket) =>
                                                ticket.status === "Resolved"
                                        ).length,
                                    },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <p className="text-2xl font-bold">
                                            {stat.count}
                                        </p>

                                        <p className="mt-2 text-xs text-slate-500">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Ticket Table */}

                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-6 py-4">
                                                    Ticket
                                                </th>

                                                <th className="px-6 py-4">
                                                    Subject
                                                </th>

                                                <th className="px-6 py-4">
                                                    Priority
                                                </th>

                                                <th className="px-6 py-4">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {tickets.map((ticket) => (
                                                <tr key={ticket.number}>
                                                    <td className="whitespace-nowrap px-6 py-5 font-semibold">
                                                        {ticket.number}
                                                    </td>

                                                    <td className="min-w-60 px-6 py-5">
                                                        {ticket.subject}
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        {ticket.priority}
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${ticket.status === "Resolved"
                                                                    ? "bg-green-50 text-green-700"
                                                                    : ticket.status ===
                                                                        "In Progress"
                                                                        ? "bg-blue-50 text-blue-700"
                                                                        : "bg-amber-50 text-amber-700"
                                                                }`}
                                                        >
                                                            {ticket.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400">
                                Sample tickets are displayed until the support
                                ticket API is connected.
                            </p>
                        </>
                    )}

                    {/* =================================== */}
                    {/* TRAINING CENTER */}
                    {/* =================================== */}

                    {section === "Training" && (
                        <>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B28B4E]">
                                    Learning & Development
                                </p>

                                <h2 className="mt-2 text-2xl font-bold">
                                    Training Center
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Access training materials, onboarding
                                    programs and franchise development resources.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {trainingModules.map((module) => (
                                    <div
                                        key={module.title}
                                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[#B28B4E]">
                                            {module.category}
                                        </span>

                                        <h3 className="mt-3 text-lg font-semibold">
                                            {module.title}
                                        </h3>

                                        <div className="mt-6 flex items-center justify-between">
                                            <p className="text-xs text-slate-500">
                                                Training Progress
                                            </p>

                                            <p className="text-xs font-semibold">
                                                {module.progress}%
                                            </p>
                                        </div>

                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-[#B28B4E]"
                                                style={{
                                                    width: `${module.progress}%`,
                                                }}
                                            />
                                        </div>

                                        <p className="mt-5 text-xs text-slate-400">
                                            Training integration coming soon.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* =================================== */}
                    {/* ANNOUNCEMENTS */}
                    {/* =================================== */}

                    {section === "Announcements" && (
                        <>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B28B4E]">
                                    Corporate Communications
                                </p>

                                <h2 className="mt-2 text-2xl font-bold">
                                    Corporate Announcements
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Stay informed about important franchise
                                    updates, policies and company news.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {announcements.map((announcement) => (
                                    <div
                                        key={announcement.title}
                                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[#B28B4E]">
                                            {announcement.category}
                                        </span>

                                        <h3 className="mt-3 text-lg font-semibold">
                                            {announcement.title}
                                        </h3>

                                        <p className="mt-3 text-sm leading-6 text-slate-500">
                                            {announcement.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </main>

                {/* FOOTER */}

                <footer className="mx-auto max-w-7xl px-5 pb-8 pt-4 md:px-9">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400">
                        <span>
                            © {new Date().getFullYear()} Cerna Home Care.
                            All rights reserved.
                        </span>

                        <span>
                            Franchise Resource Center
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
