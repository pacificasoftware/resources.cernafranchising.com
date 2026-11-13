
import { NextRequest, NextResponse } from "next/server";

 
const API_BASE = (
    process.env.CERNA_API_BASE_URL ||
    `${(
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "https://api.cernahomecare.com"
    ).replace(/\/$/, "")}/api`
).replace(/\/$/, "");

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const email = String(
            body.email ?? body.Email ?? ""
        ).trim();

        const password = String(
            body.password ?? body.Password ?? ""
        );

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required." },
                { status: 400 }
            );
        }

        const formData = new URLSearchParams();

        formData.set("Email", email);
        formData.set("Password", password);

        const res = await fetch(
            `${API_BASE}/Auth/GetAdminLogin`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
                cache: "no-store",
                signal: AbortSignal.timeout(15000),
            }
        );

        const responseText = await res.text();

        let data: Record<string, unknown>;

        try {
            data = JSON.parse(responseText);
            if (!data || typeof data !== "object" || Array.isArray(data)) {
                throw new Error("Invalid response object");
            }
        } catch {
            console.error(
                "Cerna login API returned invalid JSON:",
                res.status
            );

            return NextResponse.json(
                { error: "Authentication service returned an invalid response." },
                { status: 502 }
            );
        }

        if (!res.ok) {
            return NextResponse.json(
                {
                    error: String(
                        data.statusMessage ??
                        data.message ??
                        data.error ??
                        "Incorrect email or password."
                    ),
                },
                { status: res.status }
            );
        }

        const token = String(
            data.token ??
            data.Token ??
            data.jwtToken ??
            data.JwtToken ??
            data.accessToken ??
            data.AccessToken ??
            ""
        );

        if (!token) {
            return NextResponse.json(
                {
                    error:
                        "Login succeeded, but the API did not return an authentication token.",
                },
                { status: 502 }
            );
        }

        const user = {
            adminUserId:
                data.AdminUserId ??
                data.adminUserId ??
                data.AdminId ??
                data.adminId ??
                null,

            fullName:
                data.FullName ??
                data.fullName ??
                "",

            email:
                data.Email ??
                data.email ??
                email,

            roleId:
                data.RoleId ??
                data.roleId ??
                null,

            roleName:
                data.RoleName ??
                data.roleName ??
                "",

            locationId:
                data.LocationId ??
                data.locationId ??
                null,

            locationName:
                data.LocationName ??
                data.locationName ??
                "",

            avatarUrl: resolveAvatarUrl(
                data.AvatarUrl ??
                data.avatarUrl ??
                ""
            ),
        };

        const response = NextResponse.json({
            success: true,
            user,
        });

        console.log("CERNA AVATAR DEBUG:", {
            AvatarUrl: data.AvatarUrl,
            avatarUrl: data.avatarUrl,

        });
        // Server-managed session.
        // Cookie lifetime must not exceed the API token lifetime.
        response.cookies.set("cerna_portal_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 8,
        });

        response.headers.set("Cache-Control", "no-store");

        return response;
    } catch (error) {
        console.error("Cerna login request failed:", error);

        return NextResponse.json(
            { error: "Unable to connect to the login service." },
            { status: 502 }
        );
    }

    function resolveAvatarUrl(value: unknown): string {
        if (typeof value !== "string" || !value.trim()) {
            return "";
        }

        const avatar = value.trim();

        // Already an absolute URL
        if (/^https?:\/\//i.test(avatar)) {
            return avatar;
        }

        // Relative URLs need the correct image host.
        const assetBase = (
            process.env.CERNA_AVATAR_BASE_URL ||
            "https://api.cernahomecare.com"
        ).replace(/\/$/, "");

        try {
            return new URL(avatar, `${assetBase}/`).toString();
        } catch {
            return "";
        }
    }

}
