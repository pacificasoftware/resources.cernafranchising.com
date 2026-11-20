
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ResourceCategoryPage from "@/app/components/ResourceCategoryPage";
import { resourceLibrary } from "@/app/lib/resource-library";

// This authenticated page requires request-time rendering.
export const instant = false;

export default async function Page() {
    const token = (await cookies()).get("cerna_portal_token")?.value;

    if (!token) {
        redirect("/login");
    }

    return (
        <ResourceCategoryPage
            category={resourceLibrary["clinical-compliance"]}
        />
    );
}
