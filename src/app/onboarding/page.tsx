"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FormValues = {
    legalBusinessName: string;
    dbaName: string;
    businessAddress: string;
    city: string;
    state: string;
    zip: string;
    mainPhone: string;
    businessEmail: string;
    franchiseTerritory: string;
    careersEmail: string;
    tollFreePhone: string;
    address2: string;
    slug: string;
    heroImageUrl: string;
    coverageTitle: string;
    coverageAreas: string;
    pageTitle: string;
    metaDescription: string;
    shortDescription: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    operationsContact: string;
    operationsEmail: string;
    billingContact: string;
    billingEmail: string;
    emergencyContact: string;
    emergencyPhone: string;
    expectedOpeningDate: string;
    operatingHours: string;
    servicesOffered: string;
    staffingPlan: string;
    businessLicense: File | null;
    insuranceCertificate: File | null;
    franchiseAgreement: File | null;
    comments: string;
    certifyAccuracy: boolean;
    acknowledgePolicies: boolean;
};

type PersistedValues = Omit<FormValues, "businessLicense" | "insuranceCertificate" | "franchiseAgreement">;
type Status = "idle" | "saving" | "saved" | "submitting" | "submitted" | "error";

const STORAGE_KEY_PREFIX = "cerna-franchise-onboarding-draft-v2";
const STEPS = [
    { title: "Franchise Information", subtitle: "Business identity, contact details and address" },
    { title: "Owner & Contacts", subtitle: "Owners and additional contacts" },
    { title: "Website & SEO", subtitle: "Proposed public website information" },
    { title: "Coverage Areas", subtitle: "Proposed service areas" },
    { title: "Business Documents", subtitle: "Documents for HQ review" },
    { title: "Operations Setup", subtitle: "Opening date and operating plans" },
    { title: "Review & Submit", subtitle: "Review and send to Cerna HQ" },
] as const;

const initialValues: FormValues = {
    legalBusinessName: "", dbaName: "", businessAddress: "", city: "", state: "", zip: "",
    mainPhone: "", businessEmail: "", franchiseTerritory: "",
    careersEmail: "", tollFreePhone: "", address2: "", slug: "", heroImageUrl: "",
    coverageTitle: "", coverageAreas: "", pageTitle: "", metaDescription: "", shortDescription: "",
    ownerName: "", ownerEmail: "",
    ownerPhone: "", operationsContact: "", operationsEmail: "", billingContact: "",
    billingEmail: "", emergencyContact: "", emergencyPhone: "", expectedOpeningDate: "",
    operatingHours: "", servicesOffered: "", staffingPlan: "", businessLicense: null,
    insuranceCertificate: null, franchiseAgreement: null, comments: "", certifyAccuracy: false,
    acknowledgePolicies: false,
};

// ASP.NET Core typically serializes entity properties as camelCase. Support legacy PascalCase responses too.
function readValue(source: Record<string, unknown> | null | undefined, key: string): string {
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    const value = source?.[key] ?? source?.[pascal];
    return value == null ? "" : String(value);
}

function displayCoverage(value: string): string {
    if (!value || value === "[]") return "";
    try {
        const data: unknown = JSON.parse(value);
        if (!Array.isArray(data)) return value;
        if (data.every((x) => typeof x === "string")) return data.join("\n");
        if (data.every((x) => x && typeof x === "object" && "county" in x && "areas" in x)) {
            return data.map((x) => {
                const item = x as { county: string; areas: string[] };
                return [item.county, ...(item.areas || [])].join("\n");
            }).join("\n\n");
        }
    } catch { /* Existing unstructured values are shown unchanged. */ }
    return value;
}

// Franchisee-friendly coverage format:
// [County Name] City 1; City 2; City 3
// One county per line. The API always receives the original JSON structure.
type CoverageGroup = { county: string; areas: string[] };

function parseCoverageInput(input: string): CoverageGroup[] {
    const text = input.trim();
    if (!text) return [];

    // Also accept a pasted Admin Portal JSON array for compatibility.
    if (text.startsWith("[")) {
        try {
            const parsed: unknown = JSON.parse(text);
            if (Array.isArray(parsed) && parsed.every((item) =>
                item && typeof item === "object" &&
                typeof item.county === "string" &&
                Array.isArray(item.areas) &&
                item.areas.every((area: unknown) => typeof area === "string")
            )) {
                return parsed as CoverageGroup[];
            }
        } catch { /* User-friendly input also starts with '['. */ }
    }

    return text.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
        const match = line.trim().match(/^\[([^\]\r\n]+)\]\s*(.+)$/);
        if (!match) {
            throw new Error(`Line ${index + 1}: use [County Name] City 1; City 2`);
        }
        const county = match[1].trim();
        const areas = match[2].split(";").map((area) => area.trim()).filter(Boolean);
        if (!county || areas.length === 0) {
            throw new Error(`Line ${index + 1}: enter a county and at least one city.`);
        }
        return { county, areas };
    });
}

function formatCoverageForEditor(input: string): string {
    if (!input.trim()) return "";
    try {
        const parsed: unknown = JSON.parse(input);
        if (Array.isArray(parsed) && parsed.every((item) =>
            item && typeof item === "object" &&
            typeof item.county === "string" &&
            Array.isArray(item.areas) &&
            item.areas.every((area: unknown) => typeof area === "string")
        )) {
            return (parsed as CoverageGroup[])
                .map(({ county, areas }) => `[${county}] ${areas.join("; ")}`)
                .join("\n");
        }
    } catch { /* Keep existing user-friendly text untouched. */ }
    return input;
}

function coverageToJson(input: string): string {
    return JSON.stringify(parseCoverageInput(input));
}

// Keep US ZIP codes to five digits and format US telephone numbers as users type.
const phoneFields = new Set(["mainPhone", "tollFreePhone", "ownerPhone", "emergencyPhone"]);
const digitsOnly = (value: string) => value.replace(/\D/g, "");

function formatZip(value: string): string {
    return digitsOnly(value).slice(0, 5);
}

function formatPhone(value: string): string {
    const digits = digitsOnly(value).slice(0, 10);
    if (!digits) return "";
    if (digits.length < 3) return `(${digits}`;
    if (digits.length === 3) return `(${digits})`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatInput(name: string, value: string): string {
    if (name === "zip") return formatZip(value);
    if (phoneFields.has(name)) return formatPhone(value);
    return value;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200";
const labelClass = "block text-sm font-medium text-slate-700";

function Field({ label, name, value, onChange, required = false, type = "text", placeholder, error }: {
    label: string; name: string; value: string; onChange: (name: string, value: string) => void;
    required?: boolean; type?: string; placeholder?: string; error?: string;
}) {
    return (
        <label className={labelClass}>
            {label}{required && <span className="ml-1 text-red-600">*</span>}
            <input
                name={name}
                type={name === "zip" ? "text" : type}
                inputMode={name === "zip" || phoneFields.has(name) ? "numeric" : undefined}
                autoComplete={name === "zip" ? "postal-code" : phoneFields.has(name) ? "tel" : undefined}
                maxLength={name === "zip" ? 5 : phoneFields.has(name) ? 14 : undefined}
                value={value}
                placeholder={placeholder ?? (phoneFields.has(name) ? "(999) 999-9999" : name === "zip" ? "99999" : undefined)}
                onChange={(e) => onChange(name, e.target.value)}
                className={`${inputClass} ${error ? "border-red-500" : ""}`}
                aria-invalid={Boolean(error)}
            />
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}
function UploadField({ label, value, onChange }: { label: string; value: File | null; onChange: (file: File | null) => void }) {
    return (
        <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <span className="block text-sm font-semibold text-slate-800">{label}</span>
            <span className="mt-1 block text-xs text-slate-500">PDF, PNG, or JPG; 10 MB maximum. Files are not saved in local drafts.</span>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-white"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
            {value && <span className="mt-2 block text-xs text-emerald-700">Selected: {value.name}</span>}
        </label>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return <section className="space-y-4"><h3 className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">{title}</h3><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>;
}

export default function OnboardingWizard() {
    const router = useRouter();

    const [onboardingStatus, setOnboardingStatus] =
        useState<string>("");

    const [step, setStep] = useState(0);

    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");
    const [hydrated, setHydrated] = useState(false);
    const [storageKey, setStorageKey] = useState("");
    const [loadError, setLoadError] = useState("");
    const [hqMetadata, setHqMetadata] = useState({
        locationId: "", latitude: "", longitude: "", sortOrder: "",
        isActive: false, isPublished: false,
    });

    useEffect(() => {
        let cancelled = false;

        async function loadOnboarding() {
            try {
                const response = await fetch("/api/onboarding/me", {
                    credentials: "same-origin",
                    cache: "no-store",
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));

                    if (response.status === 403) {
                        throw new Error(
                            "Franchisee Access Required|" +
                            "This account doesn't have access to franchisee onboarding. " +
                            "Please sign out and sign in using your franchise location account."
                        );
                    }

                    if (response.status === 401) {
                        throw new Error(
                            "Session Expired|Please sign in to continue your onboarding."
                        );
                    }

                    throw new Error(
                        errorData.message ||
                        "We couldn't load your onboarding information. Please try again."
                    );
                }

                const { onboarding, location, locationDraft } = await response.json();
                if (cancelled) return;

                const getLocation = (key: string) => readValue(location, key);
                const locationRaw = (key: string): unknown => {
                    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
                    return location?.[key] ?? location?.[pascal];
                };
                setHqMetadata({
                    locationId: getLocation("locationId"),
                    latitude: getLocation("latitude"),
                    longitude: getLocation("longitude"),
                    sortOrder: getLocation("sortOrder"),
                    isActive: locationRaw("isActive") === true,
                    isPublished: locationRaw("isPublished") === true,
                });
                const getDraft = (key: string) => readValue(locationDraft, key);
                const getOnboarding = (key: string) => readValue(onboarding, key);
                const pick = (draftKey: string, locationKey: string = draftKey) =>
                    locationDraft != null ? getDraft(draftKey) : getLocation(locationKey);

                const locationFields: Partial<FormValues> = {
                    dbaName: pick("locationName"),
                    businessAddress: getOnboarding("businessAddress") || pick("address1"),
                    address2: pick("address2"),
                    city: getOnboarding("businessCity") || pick("city"),
                    state: getOnboarding("businessState") || pick("state"),
                    zip: getOnboarding("businessZip") || pick("zipCode"),
                    mainPhone: pick("phone"),
                    businessEmail: pick("email"),
                    careersEmail: pick("careersEmail"),
                    tollFreePhone: pick("tollFreePhone"),
                    slug: pick("slug"),
                    heroImageUrl: pick("heroImageUrl"),
                    coverageTitle: pick("coverageTitle"),
                    coverageAreas: pick("coverageAreas"),
                    franchiseTerritory: pick("coverageTitle"),
                    pageTitle: pick("pageTitle"),
                    metaDescription: pick("metaDescription"),
                    shortDescription: pick("shortDescription"),
                };

                const id = getLocation("locationId");
                const key = id ? `${STORAGE_KEY_PREFIX}-${id}` : "";
                setStorageKey(key);
                let localDraft: Partial<PersistedValues> = {};
                if (key && !["Submitted", "Approved"].includes(getOnboarding("status"))) {
                    try {
                        const saved = window.localStorage.getItem(key);
                        if (saved) localDraft = JSON.parse(saved) as Partial<PersistedValues>;
                    } catch { /* Ignore corrupted local drafts. */ }
                }

                setOnboardingStatus(getOnboarding("status") || "NotStarted");
                setValues({
                    ...initialValues,
                    ...locationFields,
                    legalBusinessName: getOnboarding("legalBusinessName"),
                    ownerName: getOnboarding("contactName") || getLocation("contactName"),
                    ownerEmail: getOnboarding("contactEmail") || getLocation("email"),
                    expectedOpeningDate: getOnboarding("targetOpeningDate").slice(0, 10),
                    operationsContact: getOnboarding("operationsContact"),
                    operationsEmail: getOnboarding("operationsEmail"),
                    billingContact: getOnboarding("billingContact"),
                    billingEmail: getOnboarding("billingEmail"),
                    emergencyContact: getOnboarding("emergencyContact"),
                    emergencyPhone: getOnboarding("emergencyPhone"),
                    operatingHours: getOnboarding("operatingHours"),
                    servicesOffered: getOnboarding("servicesOffered"),
                    staffingPlan: getOnboarding("staffingPlan"),
                    comments: getOnboarding("comments"),
                    ...localDraft,
                    coverageAreas: formatCoverageForEditor(
                        String(localDraft.coverageAreas ?? locationFields.coverageAreas ?? "")
                    ),
                    zip: formatZip(String(localDraft.zip ?? locationFields.zip ?? "")),
                    mainPhone: formatPhone(String(localDraft.mainPhone ?? locationFields.mainPhone ?? "")),
                    tollFreePhone: formatPhone(String(localDraft.tollFreePhone ?? locationFields.tollFreePhone ?? "")),
                    ownerPhone: formatPhone(String(localDraft.ownerPhone ?? (getOnboarding("contactPhone") || getLocation("phone")) ?? "")),
                    emergencyPhone: formatPhone(String(localDraft.emergencyPhone ?? getOnboarding("emergencyPhone") ?? "")),
                });
            } catch (error) {
                if (!cancelled) {
                    setLoadError(error instanceof Error ? error.message : "Unable to load onboarding.");
                }
            } finally {
                if (!cancelled) setHydrated(true);
            }
        }

        loadOnboarding();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!hydrated || !storageKey || status === "submitted" || onboardingStatus === "Submitted" || onboardingStatus === "Approved") return;
        const timer = window.setTimeout(() => {
            try {
                const { businessLicense: _license, insuranceCertificate: _insurance, franchiseAgreement: _agreement, ...draft } = values;
                void _license; void _insurance; void _agreement;
                window.localStorage.setItem(storageKey, JSON.stringify(draft));
                setStatus((current) => current === "submitting" ? current : "saved");
            } catch { setStatus((current) => current === "submitting" ? current : "error"); }
        }, 600);
        return () => window.clearTimeout(timer);
    }, [values, hydrated, storageKey, status === "submitted", onboardingStatus]);

    const update = (name: string, value: string | boolean | File | null) => {
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
        setMessage("");
        setStatus("idle");
    };
    const changeText = (name: string, value: string) => update(name, formatInput(name, value));

    const validateStep = (index: number) => {
        const next: Record<string, string> = {};
        const requireField = (name: keyof FormValues, label: string) => {
            const value = values[name];
            if (typeof value === "string" && !value.trim()) next[name] = `${label} is required.`;
        };
        const validEmail = (name: keyof FormValues) => {
            const value = values[name];
            if (typeof value === "string" && value.trim() && !emailRegex.test(value)) next[name] = "Enter a valid email address.";
        };
        if (index === 0) {
            requireField("legalBusinessName", "Legal business name");
            requireField("businessAddress", "Business address");
            requireField("city", "City");
            requireField("state", "State");
            requireField("zip", "ZIP code");
            requireField("mainPhone", "Main phone");
            requireField("businessEmail", "Business email");
            if (values.zip && !/^\d{5}$/.test(values.zip)) next.zip = "Enter a five-digit ZIP code.";
            if (values.mainPhone && digitsOnly(values.mainPhone).length !== 10) next.mainPhone = "Enter a 10-digit phone number.";
            if (values.tollFreePhone && digitsOnly(values.tollFreePhone).length !== 10) next.tollFreePhone = "Enter a 10-digit phone number.";
            validEmail("businessEmail");
            validEmail("careersEmail");
        }
        if (index === 1) {
            requireField("ownerName", "Owner name");
            requireField("ownerEmail", "Owner email");
            requireField("ownerPhone", "Owner phone");
            if (values.ownerPhone && digitsOnly(values.ownerPhone).length !== 10) next.ownerPhone = "Enter a 10-digit phone number.";
            if (values.emergencyPhone && digitsOnly(values.emergencyPhone).length !== 10) next.emergencyPhone = "Enter a 10-digit phone number.";
            validEmail("ownerEmail"); validEmail("operationsEmail"); validEmail("billingEmail");
        }
        if (index === 3) {
            try {
                parseCoverageInput(values.coverageAreas);
            } catch (error) {
                next.coverageAreas = error instanceof Error
                    ? error.message
                    : "Enter coverage as [County] City 1; City 2";
            }
        }
        if (index === 4) {
            for (const key of ["businessLicense", "insuranceCertificate", "franchiseAgreement"] as const) {
                const file = values[key];
                if (file && (file.size > 10 * 1024 * 1024 || !["application/pdf", "image/png", "image/jpeg"].includes(file.type))) {
                    next[key] = "Upload a PDF, JPG, or PNG under 10 MB.";
                }
            }
        }
        if (index === 6) {
            if (!values.certifyAccuracy) next.certifyAccuracy = "Please confirm your information is accurate.";
            if (!values.acknowledgePolicies) next.acknowledgePolicies = "Please acknowledge the onboarding policies.";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const nextStep = () => {
        if (!validateStep(step)) { setMessage("Please correct the highlighted fields before continuing."); return; }
        setMessage(""); setStep((current) => Math.min(current + 1, STEPS.length - 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const previousStep = () => { setErrors({}); setMessage(""); setStep((current) => Math.max(current - 1, 0)); };

    const submit = async () => {
        // Validate all wizard steps before submitting.
        for (let i = 0; i < STEPS.length; i++) {
            if (!validateStep(i)) {
                setStep(i);
                setMessage(
                    "Please complete the required fields before submitting."
                );
                return;
            }
        }

        // Prevent silently discarding selected documents.
        if (
            values.businessLicense ||
            values.insuranceCertificate ||
            values.franchiseAgreement
        ) {
            setStep(4);
            setMessage(
                "Document uploads are not connected to the server yet. " +
                "Please do not submit until document upload support is implemented."
            );
            return;
        }



        setStatus("submitting");
        setMessage("");

        try {
            // STEP 1: Save onboarding data to SQL Server.
            const saveResponse = await fetch("/api/onboarding/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    currentStep: 7,

                    // Onboarding information
                    contactName: values.ownerName,
                    contactEmail: values.ownerEmail,
                    contactPhone: values.ownerPhone,

                    legalBusinessName: values.legalBusinessName,
                    businessAddress: values.businessAddress,
                    businessCity: values.city,
                    businessState: values.state,
                    businessZip: values.zip,

                    targetOpeningDate: values.expectedOpeningDate || null,
                    officeSecured: null,
                    staffingStarted: null,

                    operationsContact: values.operationsContact,
                    operationsEmail: values.operationsEmail,
                    billingContact: values.billingContact,
                    billingEmail: values.billingEmail,
                    emergencyContact: values.emergencyContact,
                    emergencyPhone: values.emergencyPhone,
                    operatingHours: values.operatingHours,
                    servicesOffered: values.servicesOffered,
                    staffingPlan: values.staffingPlan,
                    comments: values.comments,

                    // Franchisee-proposed location changes
                    locationDraft: {
                        locationName: values.dbaName,
                        contactName: values.ownerName,

                        address1: values.businessAddress,
                        address2: values.address2,
                        city: values.city,
                        state: values.state,
                        zipCode: values.zip,

                        phone: values.mainPhone,
                        email: values.businessEmail,
                        careersEmail: values.careersEmail,
                        tollFreePhone: values.tollFreePhone,

                        slug: values.slug,
                        heroImageUrl: values.heroImageUrl,

                        coverageTitle: values.coverageTitle,
                        coverageAreas: coverageToJson(values.coverageAreas),

                        pageTitle: values.pageTitle,
                        metaDescription: values.metaDescription,
                        shortDescription: values.shortDescription,
                    },
                }),
            });

            const saveData = await saveResponse.json().catch(
                () => ({})
            );

            if (!saveResponse.ok) {
                throw new Error(
                    saveData.message ||
                    `Unable to save onboarding (HTTP ${saveResponse.status}).`
                );
            }

            // STEP 2: Submit saved onboarding for HQ approval.
            const submitResponse = await fetch(
                "/api/onboarding/submit",
                {
                    method: "POST",
                    credentials: "same-origin",
                }
            );

            const submitData = await submitResponse.json().catch(
                () => ({})
            );

            if (!submitResponse.ok) {
                throw new Error(
                    submitData.message ||
                    `Unable to submit onboarding (HTTP ${submitResponse.status}).`
                );
            }

            // STEP 3: Only mark success after the API confirms submission.
            if (storageKey) window.localStorage.removeItem(storageKey);

            setOnboardingStatus("Submitted");
            setStatus("submitted");
            setMessage("");

        } catch (error) {
            setStatus("error");

            setMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to submit onboarding. Please try again."
            );
        }
    };


    const completion = useMemo(() => Math.round((step / (STEPS.length - 1)) * 100), [step]);
    const field = (name: keyof FormValues, label: string, extras: { required?: boolean; type?: string; placeholder?: string } = {}) => (
        <Field key={name} name={name} label={label} value={String(values[name] ?? "")} onChange={changeText} error={errors[name]} {...extras} />
    );
    const summary = (heading: string, items: Array<[string, string]>) => (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="mb-3 font-semibold text-slate-900">{heading}</h3>
            <dl className="grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-0.5 break-words text-sm text-slate-800">{value || "Not provided"}</dd></div>)}</dl>
        </section>
    );

    if (loadError) {
        const isAccessDenied = loadError.startsWith("Franchisee Access Required");
        const isSessionExpired = loadError.startsWith("Session Expired");

        const [errorTitle, errorDescription] = loadError.includes("|")
            ? loadError.split("|", 2)
            : ["Unable to Load Onboarding", loadError];

        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">

                    <div className="mb-4 text-4xl">🔒</div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        {errorTitle}
                    </h1>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                        {errorDescription}
                    </p>

                    <div className="mt-8 flex flex-col gap-3">
                        {(isAccessDenied || isSessionExpired) && (
                            <button
                                type="button"
                                onClick={() => router.push("/dashboard")}
                                className="rounded-lg bg-[#112E46] px-6 py-3 font-semibold text-white hover:bg-[#1C4565]"
                            >
                                Return to Dashboard to Sign Out
                            </button>
                        )}

                        {isSessionExpired && (
                            <button
                                type="button"
                                onClick={() => router.push("/login")}
                                className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700"
                            >
                                Go to Login
                            </button>
                        )}

                        {!isAccessDenied && !isSessionExpired && (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="rounded-lg bg-[#112E46] px-6 py-3 font-semibold text-white hover:bg-[#1C4565]"
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            </main>
        );
    }

    if (!hydrated) {
        return <main className="min-h-screen bg-slate-50 px-4 py-16 text-center text-slate-600">Loading your onboarding information…</main>;
    }

    // Onboarding approved by Cerna HQ
    if (onboardingStatus === "Approved") {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-16">
                <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
                    <div className="mb-4 text-5xl text-emerald-600">
                        ✓
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        Onboarding Approved
                    </h1>

                    <p className="mt-4 text-slate-600">
                        Congratulations! Your franchise onboarding
                        has been approved by Cerna Home Care.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="mt-8 rounded-lg bg-[#112E46] px-8 py-3 font-semibold text-white hover:bg-[#1C4565]"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </main>
        );
    }

    if (status === "submitted" || onboardingStatus === "Submitted") {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-16">
                <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">

                    <div className="mb-4 text-5xl text-emerald-600">
                        ✓
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        Onboarding Submitted
                    </h1>

                    <p className="mt-4 text-slate-600">
                        Thank you. Your information has been submitted
                        for Cerna review. You'll receive an update when
                        your onboarding is approved or if changes are needed.
                    </p>

                    <p className="mt-4 text-sm text-slate-500">
                        Full resources access is granted only after
                        administrator approval.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="mt-8 rounded-lg bg-[#112E46] px-8 py-3 font-semibold text-white transition hover:bg-[#1C4565]"
                    >
                        OK — Return to Dashboard
                    </button>

                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-4xl">
                <header className="mb-7"><span className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Cerna Franchising</span>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Franchisee Onboarding</h1>
                    <p className="mt-2 text-slate-600">Complete your information to get ready for your Cerna franchise journey.</p>
                    <p className="mt-2 text-sm text-amber-800">
                        Your information will be submitted to Cerna HQ for review.
                        Location changes will not become active until approved.
                    </p>
                </header>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-900 px-5 py-6 text-white sm:px-8">
                        <div className="flex items-center justify-between gap-3 text-sm"><span>Step {step + 1} of {STEPS.length}</span><span>{completion}% through wizard</span></div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(step + 1) / STEPS.length * 100}%` }} /></div>
                        <h2 className="mt-5 text-xl font-semibold">{STEPS[step].title}</h2><p className="mt-1 text-sm text-slate-300">{STEPS[step].subtitle}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 py-4 sm:px-8" aria-label="Onboarding steps">
                        {STEPS.map((item, index) => <button key={item.title} type="button" disabled={index > step}
                            onClick={() => { setStep(index); setErrors({}); setMessage(""); }}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${index === step ? "bg-amber-100 text-amber-900" : index < step ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-slate-100 text-slate-400"}`}>
                            {index + 1}. {item.title}</button>)}
                    </div>
                    <div className="space-y-7 px-5 py-7 sm:px-8">
                        {step === 0 && <>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                                <strong>HQ-managed settings (view only)</strong>
                                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    <span>Location ID: {hqMetadata.locationId || "—"}</span>
                                    <span>Active: {hqMetadata.isActive ? "Yes" : "No"}</span>
                                    <span>Published: {hqMetadata.isPublished ? "Yes" : "No"}</span>
                                    <span>Sort order: {hqMetadata.sortOrder || "—"}</span>
                                    <span>Latitude: {hqMetadata.latitude || "—"}</span>
                                    <span>Longitude: {hqMetadata.longitude || "—"}</span>
                                </div>
                            </div>
                            <Section title="Business identity">
                                {field("legalBusinessName", "Legal business name", { required: true })}
                                {field("dbaName", "DBA / franchise location name")}
                                {field("businessAddress", "Business street address", { required: true })}
                                {field("address2", "Address line 2 / Suite")}
                                {field("city", "City", { required: true })}
                                {field("state", "State", { required: true, placeholder: "CA" })}
                                {field("zip", "ZIP code", { required: true })}
                            </Section>
                            <Section title="Franchise contact details">
                                {field("mainPhone", "Main business phone", { required: true, type: "tel" })}
                                {field("businessEmail", "Business email", { required: true, type: "email" })}
                                {field("careersEmail", "Careers email", { type: "email" })}
                                {field("tollFreePhone", "Toll-free phone", { type: "tel" })}
                                {field("franchiseTerritory", "Assigned franchise territory")}
                            </Section>
                        </>}
                        {step === 1 && <>
                            <Section title="Franchise owner">
                                {field("ownerName", "Owner's full name", { required: true })}
                                {field("ownerEmail", "Owner's email", { required: true, type: "email" })}
                                {field("ownerPhone", "Owner's phone", { required: true, type: "tel" })}
                            </Section>
                            <Section title="Additional contacts">
                                {field("operationsContact", "Operations contact name")}
                                {field("operationsEmail", "Operations contact email", { type: "email" })}
                                {field("billingContact", "Billing contact name")}
                                {field("billingEmail", "Billing contact email", { type: "email" })}
                                {field("emergencyContact", "Emergency contact name")}
                                {field("emergencyPhone", "Emergency contact phone", { type: "tel" })}
                            </Section>
                        </>}
                        {step === 2 && <>
                            <p className="text-sm text-slate-600">These are proposed website details. HQ will review changes before they become official.</p>
                            <Section title="Website settings">
                                {field("slug", "Website URL slug")}
                                {field("heroImageUrl", "Hero image URL", { placeholder: "Provided by HQ or uploaded to Cerna media library" })}
                            </Section>
                            <Section title="Website content and SEO">
                                {field("pageTitle", "SEO page title")}
                                <label className={labelClass}>Short description<textarea rows={3} value={values.shortDescription} onChange={(e) => changeText("shortDescription", e.target.value)} className={inputClass} /></label>
                                <label className={labelClass}>Meta description<textarea rows={3} value={values.metaDescription} onChange={(e) => changeText("metaDescription", e.target.value)} className={inputClass} /></label>
                            </Section>
                            <p className="text-xs text-amber-800">Image uploads and publishing are controlled by HQ. This field captures an existing image URL only.</p>
                        </>}
                        {step === 3 && <>
                            <Section title="Service territory">
                                {field("coverageTitle", "Coverage title")}
                            </Section>
                            <label className={labelClass}>
                                Coverage areas by county
                                <p className="mt-1 text-xs text-slate-600">
                                    One county per line. Put the county in [square brackets], then separate cities with semicolons (;).
                                </p>
                                <textarea rows={9} spellCheck={false} value={values.coverageAreas}
                                    onChange={(e) => changeText("coverageAreas", e.target.value)}
                                    className={`${inputClass} font-mono text-xs ${errors.coverageAreas ? "border-red-500" : ""}`}
                                    placeholder={'[Orange County] Tustin; Irvine; Santa Ana\n[Los Angeles County] Long Beach; Torrance'} />
                                {errors.coverageAreas && (
                                    <p className="mt-1 text-sm text-red-600">{errors.coverageAreas}</p>
                                )}
                            </label>
                            <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
                                <strong>What the API will save (JSON)</strong>
                                <pre className="mt-2 whitespace-pre-wrap break-all text-xs">{(() => {
                                    try {
                                        return JSON.stringify(parseCoverageInput(values.coverageAreas), null, 2);
                                    } catch {
                                        return "Finish each county line to see the JSON preview.";
                                    }
                                })()}</pre>
                            </div>
                            <p className="text-xs text-amber-800">These are proposed coverage areas. HQ must approve them before they become official.</p>
                        </>}
                        {step === 4 && <>
                            <p className="text-sm text-slate-600">Upload any documents you have available now. Cerna can request additional items during approval.</p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {([["businessLicense", "Business license"], ["insuranceCertificate", "Insurance certificate"], ["franchiseAgreement", "Franchise agreement"]] as const).map(([key, label]) => (
                                    <div key={key}><UploadField label={label} value={values[key]} onChange={(file) => update(key, file)} />
                                        {errors[key] && <span className="mt-1 text-xs text-red-600">{errors[key]}</span>}</div>
                                ))}
                            </div>
                            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Document upload is not connected to the API yet. Do not select files for submission until upload support is implemented.</p>
                        </>}
                        {step === 5 && <>
                            <Section title="Launch & operations">
                                {field("expectedOpeningDate", "Expected opening date", { type: "date" })}
                                {field("operatingHours", "Operating hours", { placeholder: "e.g. Mon–Fri 8 AM–6 PM" })}
                            </Section>
                            <label className={labelClass}>Services you plan to offer
                                <textarea rows={4} value={values.servicesOffered} onChange={(e) => changeText("servicesOffered", e.target.value)}
                                    className={inputClass} placeholder="e.g. Companion care, personal care, respite care" /></label>
                            <label className={labelClass}>Staffing and recruiting plan
                                <textarea rows={4} value={values.staffingPlan} onChange={(e) => changeText("staffingPlan", e.target.value)}
                                    className={inputClass} placeholder="Your initial team and hiring plans" /></label>
                            <label className={labelClass}>Other information or questions for Cerna
                                <textarea rows={3} value={values.comments} onChange={(e) => changeText("comments", e.target.value)} className={inputClass} /></label>
                        </>}
                        {step === 6 && <>
                            {summary("Franchise Information", [
                                ["Legal business name", values.legalBusinessName], ["DBA / location", values.dbaName],
                                ["Address", [values.businessAddress, values.city, values.state, values.zip].filter(Boolean).join(", ")],
                                ["Phone", values.mainPhone], ["Email", values.businessEmail], ["Careers email", values.careersEmail], ["Toll-free", values.tollFreePhone], ["Territory", values.franchiseTerritory]
                            ])}
                            {summary("Owner & Contacts", [
                                ["Owner", values.ownerName], ["Owner email", values.ownerEmail], ["Owner phone", values.ownerPhone],
                                ["Operations contact", values.operationsContact], ["Billing contact", values.billingContact],
                                ["Emergency contact", values.emergencyContact]
                            ])}
                            {summary("Website & SEO", [
                                ["Slug", values.slug], ["Hero image", values.heroImageUrl], ["Page title", values.pageTitle],
                                ["Description", values.shortDescription], ["Meta description", values.metaDescription],
                            ])}
                            {summary("Coverage", [["Title", values.coverageTitle], ["Areas", values.coverageAreas]])}
                            {summary("Documents", [
                                ["Business license", values.businessLicense?.name ?? "Not uploaded"],
                                ["Insurance certificate", values.insuranceCertificate?.name ?? "Not uploaded"],
                                ["Franchise agreement", values.franchiseAgreement?.name ?? "Not uploaded"]
                            ])}
                            {summary("Operations", [
                                ["Opening date", values.expectedOpeningDate], ["Hours", values.operatingHours],
                                ["Services", values.servicesOffered], ["Staffing plan", values.staffingPlan]
                            ])}
                            <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <label className="flex items-start gap-3 text-sm text-slate-800"><input type="checkbox" checked={values.certifyAccuracy} onChange={(e) => update("certifyAccuracy", e.target.checked)} className="mt-1 accent-amber-700" />
                                    <span>I certify that the information I provided is accurate to the best of my knowledge. {errors.certifyAccuracy && <span className="block text-xs text-red-600">{errors.certifyAccuracy}</span>}</span></label>
                                <label className="flex items-start gap-3 text-sm text-slate-800"><input type="checkbox" checked={values.acknowledgePolicies} onChange={(e) => update("acknowledgePolicies", e.target.checked)} className="mt-1 accent-amber-700" />
                                    <span>I understand that onboarding is subject to Cerna approval and that submission does not automatically grant access to restricted resources. {errors.acknowledgePolicies && <span className="block text-xs text-red-600">{errors.acknowledgePolicies}</span>}</span></label>
                            </div>
                        </>}
                        {message && (
                            <div
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {message}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
                            <div className="text-xs text-slate-500">
                                {status === "saved"
                                    ? "Draft saved on this browser"
                                    : status === "submitting"
                                        ? "Submitting…"
                                        : "Required fields are marked *"}
                            </div>

                            <div className="flex gap-3">
                                {step > 0 && (
                                    <button
                                        type="button"
                                        onClick={previousStep}
                                        disabled={status === "submitting"}
                                        className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Back
                                    </button>
                                )}

                                {step < STEPS.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        Continue →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={status === "submitting"}
                                        className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                                    >
                                        {status === "submitting"
                                            ? "Submitting…"
                                            : "Submit for Approval"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
