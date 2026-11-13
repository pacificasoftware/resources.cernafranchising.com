
import { NextRequest, NextResponse } from "next/server";
 
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token") || "";

    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
        return NextResponse.json(
            { message: "Invalid invitation link." },
            { status: 400 }
        );
    }

    const apiBase = process.env.CERNA_API_BASE_URL;

    if (!apiBase) {
        return NextResponse.json(
            { message: "API configuration is missing." },
            { status: 500 }
        );
    }
    try {
        const upstream = new URL(
            `${apiBase.replace(/\/+$/, "")}/PortalOnboarding/invitation`
        );

        upstream.searchParams.set("token", token);

        const response = await fetch(upstream.toString(), {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...(process.env.CERNA_API_KEY
                    ? { "X-API-KEY": process.env.CERNA_API_KEY }
                    : {}),
            },
            cache: "no-store",
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            return NextResponse.json(
                {
                    message: `Invitation API returned HTTP ${response.status}.`,
                },
                { status: response.ok ? 502 : response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                "Cache-Control": "no-store",
                "Referrer-Policy": "no-referrer",
            },
        });
    } catch (error) {
        console.error(
            "Invitation validation failed:",
            error instanceof Error ? error.name : "Unknown error"
        );

        return NextResponse.json(
            { message: "Invitation service unavailable." },
            { status: 502 }
        );
    }
}
