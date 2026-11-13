"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type InvitationDetails = {
    valid: boolean;
    email: string;
    contactName?: string;
    locationName?: string;
};

function ActivateAccountForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [invitation, setInvitation] =
        useState<InvitationDetails | null>(null);

    const [checkingInvitation, setCheckingInvitation] =
        useState(true);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadInvitation() {
            if (!/^[A-Fa-f0-9]{64}$/.test(token)) {
                setError("Your invitation link is invalid.");
                setCheckingInvitation(false);
                return;
            }

            try {
                const res = await fetch(
                    `/api/onboarding/invitation?token=${encodeURIComponent(token)}`,
                    { cache: "no-store" }
                );

                const data = await res.json();

                if (!res.ok || data.valid !== true) {
                    throw new Error(
                        data.message ||
                        "This invitation is invalid or has expired."
                    );
                }

                if (!cancelled) {
                    setInvitation(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to validate invitation."
                    );
                }
            } finally {
                if (!cancelled) {
                    setCheckingInvitation(false);
                }
            }
        }

        loadInvitation();

        return () => {
            cancelled = true;
        };
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!invitation) {
            setError("Please validate your invitation first.");
            return;
        }

        if (password.length < 12) {
            setError("Password must be at least 12 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/onboarding/activate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.message || "Activation failed."
                );
            }

            // Direct the user to login with the newly activated email.
            window.location.replace(
                `/login?activated=1&email=${encodeURIComponent(invitation.email)}`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to activate account."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-xl">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold">
                        Welcome to Cerna
                    </h1>

                    <p className="mt-3 text-sm text-slate-400">
                        Activate your Franchise Resources account
                    </p>

                    {invitation && (
                        <div className="mt-4">
                            <p className="text-sm text-amber-400">
                                {invitation.locationName}
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                                {invitation.email}
                            </p>
                        </div>
                    )}
                </div>

                {checkingInvitation ? (
                    <p className="text-center text-slate-400">
                        Validating invitation...
                    </p>
                ) : !invitation ? (
                    <p role="alert" className="text-sm text-red-400">
                        {error || "This invitation is no longer valid."}
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm">
                                Create Password
                            </label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                                minLength={12}
                                maxLength={128}
                                className="w-full rounded-lg border border-white/20 bg-slate-800 px-4 py-3 outline-none focus:border-amber-400"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                                className="w-full rounded-lg border border-white/20 bg-slate-800 px-4 py-3 outline-none focus:border-amber-400"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                        >
                            {loading
                                ? "Activating..."
                                : "Activate Account"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}

export default function ActivatePage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-slate-950" />
            }
        >
            <ActivateAccountForm />
        </Suspense>
    );
}
