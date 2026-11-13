
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const apiBase = process.env.CERNA_API_BASE_URL;

async function forwardRequest(
    method: "GET" | "PUT",
    request?: Request
) {
    const cookieStore = await cookies();
    const token = cookieStore.get("cerna_portal_token")?.value;

    if (!token) {
        return NextResponse.json(
            { message: "You are not logged in." },
            { status: 401 }
        );
    }

    if (!apiBase) {
        console.error("CERNA_API_BASE_URL is missing.");

        return NextResponse.json(
            { message: "API configuration is missing." },
            { status: 500 }
        );
    }

    try {
        const url =
            `${apiBase.replace(/\/+$/, "")}/FranchiseOnboarding/me`;

        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        };

        if (process.env.CERNA_API_KEY) {
            headers[
                process.env.CERNA_API_KEY_HEADER || "X-API-KEY"
            ] = process.env.CERNA_API_KEY;
        }

        let body: string | undefined;

        if (method === "PUT" && request) {
            body = await request.text();
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url, {
            method,
            headers,
            body,
            cache: "no-store",
        });

        const responseText = await response.text();

        console.log("Franchise onboarding API:", {
            method,
            status: response.status,
            contentType: response.headers.get("content-type"),
            errorBody: response.ok
                ? undefined
                : responseText.slice(0, 1000),
        });

        let data: unknown;

        try {
            data = responseText
                ? JSON.parse(responseText)
                : {};
        } catch {
            console.error(
                "Franchise onboarding returned non-JSON response.",
                { status: response.status }
            );

            return NextResponse.json(
                {
                    message: response.ok
                        ? "Onboarding API returned an invalid response."
                        : "The Cerna API could not save your onboarding. Please try again.",
                    upstreamStatus: response.status,
                },
                { status: response.ok ? 502 : response.status }
            );
        }

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error(
            "Franchise onboarding proxy failed:",
            error instanceof Error ? error.message : "Unknown error"
        );

        return NextResponse.json(
            { message: "Unable to reach the onboarding API." },
            { status: 502 }
        );
    }
}

export async function GET() {
    return forwardRequest("GET");
}

export async function PUT(request: Request) {
    return forwardRequest("PUT", request);
}
