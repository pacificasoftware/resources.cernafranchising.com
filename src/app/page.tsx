import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function HomeRedirect(): Promise<React.ReactNode> {
    const cookieStore = await cookies();

    const token = cookieStore.get("cerna_portal_token")?.value;

    if (token) {
        return redirect("/dashboard");
    }

    return redirect("/login");
}

export default function HomePage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
                    <p className="text-sm text-slate-500">
                        Opening Cerna Franchise Portal...
                    </p>
                </div>
            }
        >
            <HomeRedirect />
        </Suspense>
    );
} 