
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const apiBase = process.env.CERNA_API_BASE_URL;
    const token = request.cookies.get("cerna_portal_token")?.value;

    if (!token) {
        return NextResponse.json(
            {
                message: "Your session has expired. Please log in again."
            },
            { status: 401 }
        );
    }

    if (!apiBase) {
        return NextResponse.json(
            {
                message: "API configuration is missing."
            },
            { status: 500 }
        );
    }

    try {
        const response = await fetch(
            `${apiBase.replace(/\/+$/, "")}/FranchiseOnboarding/submit`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    ...(process.env.CERNA_API_KEY
                        ? { "X-API-KEY": process.env.CERNA_API_KEY }
                        : {}),
                },
                cache: "no-store",
            }
        );

        const text = await response.text();

        let data: unknown;

        try {
            data = text
                ? JSON.parse(text)
                : {
                    message: "The onboarding API returned an empty response."
                };
        } catch {
            data = {
                message: "The onboarding API returned an invalid response."
            };
        }

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error(
            "Franchise onboarding submission error:",
            error instanceof Error
                ? error.message
                : "Unknown error"
        );

        return NextResponse.json(
            {
                message: "Unable to reach the onboarding API."
            },
            { status: 502 }
        );
    }
}
