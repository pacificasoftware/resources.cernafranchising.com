import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

async function AuthenticatedDashboard() {
    const cookieStore = await cookies();

    const token =
        cookieStore.get("cerna_portal_token")?.value;

    if (!token) {
        redirect("/login");
    }

    return <DashboardClient />;
}

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
                    <p className="text-sm text-slate-500">
                        Loading Cerna Franchise Portal...
                    </p>
                </div>
            }
        >
            <AuthenticatedDashboard />
        </Suspense>
    );
}
