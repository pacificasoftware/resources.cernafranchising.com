
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoginUser = {
    adminUserId: number | string | null;
    fullName: string;
    email: string;
    roleId: number | string | null;
    roleName: string;
    locationId: number | string | null;
    locationName: string;
    avatarUrl: string;
};

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Clear credentials from the old demonstration login.
        sessionStorage.removeItem("cerna_demo_user");
    }, []);

    async function handleLogin(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        if (loading) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
                cache: "no-store",
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(
                    data.error || "Incorrect email or password."
                );
            }

            const user: LoginUser = data.user;

            // Display information only.
            // The authentication token is in an HTTP-only cookie.
            localStorage.setItem(
                "cerna_portal_user",
                JSON.stringify(user)
            );

            // Remove legacy demo state.
            sessionStorage.removeItem("cerna_demo_user");

            setPassword("");

            // Navigate after successful backend authentication.
            router.replace("/dashboard");
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected login error occurred."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-[#F5F7FA]">
            {/* Branding Panel */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#112E46] p-14 text-white lg:flex">
                <div className="absolute -right-44 -top-44 h-[500px] w-[500px] rounded-full border border-white/10" />
                <div className="absolute -bottom-52 -left-48 h-[600px] w-[600px] rounded-full border border-white/10" />

                <div className="relative z-10">
                    <div className="text-3xl font-bold tracking-[0.16em]">
                        CERNA
                    </div>
                    <div className="mt-1 text-xs tracking-[0.26em] text-slate-300">
                        HOME CARE
                    </div>
                </div>

                <div className="relative z-10 max-w-xl">
                    <div className="mb-8 h-1 w-16 rounded bg-[#C6A267]" />

                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A267]">
                        Cerna Franchise Network
                    </p>

                    <h1 className="mt-5 text-4xl font-semibold leading-tight xl:text-5xl">
                        Everything you need.
                        <br />
                        All in one place.
                    </h1>

                    <p className="mt-7 max-w-md text-base leading-8 text-slate-300">
                        Your dedicated resource center for franchise
                        operations, training materials, company resources
                        and corporate support.
                    </p>

                    <div className="mt-12 grid grid-cols-2 gap-5">
                        {[
                            ["Resource Library", "Company manuals and guides"],
                            ["Corporate Support", "Help when you need it"],
                            ["Franchise Training", "Tools for your success"],
                            ["Company Updates", "Stay connected"],
                        ].map(([title, description]) => (
                            <div
                                key={title}
                                className="rounded-xl border border-white/10 bg-white/5 p-5"
                            >
                                <div className="mb-3 text-xl text-[#C6A267]">
                                    ◇
                                </div>
                                <h3 className="text-sm font-semibold">
                                    {title}
                                </h3>
                                <p className="mt-2 text-xs leading-5 text-slate-300">
                                    {description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-xs text-slate-400">
                    © 2026 Cerna Home Care. All rights reserved.
                </p>
            </div>

            {/* Login Form */}
            <div className="flex min-h-screen w-full items-center justify-center px-6 py-12 lg:w-1/2">
                <div className="w-full max-w-md">
                    <div className="mb-12 lg:hidden">
                        <div className="text-3xl font-bold tracking-[0.16em] text-[#112E46]">
                            CERNA
                        </div>
                        <div className="mt-1 text-xs tracking-[0.26em] text-slate-500">
                            HOME CARE
                        </div>
                    </div>

                    <div className="mb-10">
                        <div className="mb-6 h-1 w-12 rounded bg-[#C6A267]" />

                        <h2 className="text-3xl font-bold tracking-tight text-[#112E46]">
                            Welcome Back
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            Sign in to access your Cerna Franchise
                            Resource Center.
                        </p>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleLogin}
                        className="space-y-6"
                    >
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Email Address
                            </label>

                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                disabled={loading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@cernahomecare.com"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-[#C6A267] focus:ring-2 focus:ring-[#C6A267]/20 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    disabled={loading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-20 text-sm text-slate-800 outline-none transition focus:border-[#C6A267] focus:ring-2 focus:ring-[#C6A267]/20 disabled:opacity-60"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-[#112E46]"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <span className="text-xs font-medium text-slate-400">
                                Forgot Password? (Coming Soon)
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-[#112E46] px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1C425F] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Login"}
                        </button>
                    </form>

                    <div className="mt-10 border-t border-slate-200 pt-8 text-center">
                        <p className="text-sm text-slate-500">
                            Need assistance accessing your account?
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#112E46]">
                            Contact Cerna Corporate Support
                        </p>
                    </div>

                    <p className="mt-14 text-center text-xs text-slate-400">
                        Authorized Cerna franchise personnel only
                    </p>
                </div>
            </div>
        </div>
    );
}
