import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const apiBase = process.env.CERNA_API_BASE_URL;

        if (!apiBase) {
            return NextResponse.json(
                { message: "API configuration is missing." },
                { status: 500 }
            );
        }

        const body = await request.json();

        if (
            typeof body?.token !== "string" ||
            !/^[A-Fa-f0-9]{64}$/.test(body.token) ||
            typeof body?.password !== "string"
        ) {
            return NextResponse.json(
                { message: "Invalid activation request." },
                { status: 400 }
            );
        }

        const apiUrl =
            `${apiBase.replace(/\/+$/, "")}/PortalOnboarding/activate`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(process.env.CERNA_API_KEY
                    ? { "X-API-KEY": process.env.CERNA_API_KEY }
                    : {}),
            },
            body: JSON.stringify({
                token: body.token,
                password: body.password,
            }),
            cache: "no-store",
        });

        const rawResponse = await response.text();
        const contentType = response.headers.get("content-type") ?? "";

        console.log("Activation API response:", {
            status: response.status,
            contentType,
            responseLength: rawResponse.length,
        });

        if (!contentType.toLowerCase().includes("json")) {
            console.error("Activation API returned non-JSON:", {
                status: response.status,
                contentType,
                responseLength: rawResponse.length,
            });

            return NextResponse.json(
                {
                    message: "Activation API returned a non-JSON response.",
                    upstreamStatus: response.status,
                    upstreamContentType: contentType,
                },
                { status: 502 }
            );
        }

        let data: unknown;

        try {
            data = JSON.parse(rawResponse);
        } catch {
            return NextResponse.json(
                {
                    message: "Activation API returned malformed JSON.",
                    upstreamStatus: response.status,
                },
                { status: 502 }
            );
        }

        if (
            data === null ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            return NextResponse.json(
                {
                    message: "Activation API returned an unexpected JSON format.",
                    upstreamStatus: response.status,
                },
                { status: 502 }
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
            "Activation proxy failed:",
            error instanceof Error ? error.name : "Unknown error"
        );

        return NextResponse.json(
            { message: "Unable to reach the activation service." },
            { status: 502 }
        );
    }
}