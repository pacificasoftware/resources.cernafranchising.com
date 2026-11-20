export type ResourceItem = {
  title: string;
  note?: string;
  status?: "Planned" | "Needs content" | "Needs integration";
};
export type ResourceGroup = { title: string; items: ResourceItem[] };
export type ResourceCategory = {
  slug: string;
  title: string;
  description: string;
  groups: ResourceGroup[];
};

export const resourceLibrary: Record<string, ResourceCategory> = {
  operations: {
    slug: "operations",
    title: "Operations",
    description: "Franchise ownership, daily operations, systems, financial procedures and contracts.",
    groups: [
      { title: "Franchise Owner", items: [
        { title: "Franchise Owner's Manual", status: "Needs content" },
        { title: "State Licensing Guidelines", note: "State-specific licensing references; future state or ZIP-code lookup", status: "Needs integration" },
      ] },
      { title: "Technology", items: [
        { title: "Vendor Contacts", status: "Needs content" },
        { title: "Approved Software & System Links", note: "Add approved tools and relevant how-to guides", status: "Needs content" },
        { title: "Security & Password Guidance", status: "Needs content" },
        { title: "Phone Tree Guidelines", status: "Needs content" },
        { title: "Business Cards", status: "Needs content" },
        { title: "Email Signature", status: "Needs content" },
      ] },
      { title: "Scheduling", items: [{ title: "Scheduling SOP", status: "Needs content" }] },
      { title: "Billing", items: [{ title: "Billing SOP", status: "Needs content" }] },
      { title: "Payroll", items: [{ title: "Payroll SOP", status: "Needs content" }] },
      { title: "Contracts", items: [{ title: "Current Approved Contracts", note: "Documents will be uploaded once approved", status: "Needs content" }] },
    ],
  },
  "sales-marketing": {
    slug: "sales-marketing",
    title: "Sales & Marketing",
    description: "Client acquisition, sales tools, messaging and approved brand resources.",
    groups: [
      { title: "Sales", items: [
        { title: "Sales Templates", status: "Needs content" },
        { title: "Sales Training Videos", note: "Arm and Team Aid videos noted in planning", status: "Needs content" },
        { title: "CRM Guide", status: "Needs content" },
        { title: "Outreach Scripts & Best Practices", status: "Needs content" },
        { title: "Admission Binder", status: "Needs content" },
        { title: "Client Agreement Template", status: "Needs content" },
        { title: "Placement Templates", status: "Needs content" },
        { title: "Assessment Template", status: "Needs content" },
      ] },
      { title: "Marketing", items: [
        { title: "Brand Guidelines", note: "Approved fonts, colors and logos", status: "Needs content" },
        { title: "Marketing Templates", status: "Needs content" },
        { title: "Local Marketing Resources", status: "Needs content" },
        { title: "Marketing Approval Process", status: "Needs content" },
      ] },
    ],
  },
  "hr-recruiting": {
    slug: "hr-recruiting",
    title: "HR/Recruiting",
    description: "Human resources policies, recruiting templates, hiring and credential procedures.",
    groups: [
      { title: "HR", items: [
        { title: "HR Templates & SOPs", status: "Needs content" },
        { title: "Job Descriptions", status: "Needs content" },
        { title: "Credential Verification", status: "Needs content" },
        { title: "Disciplinary Procedures", status: "Needs content" },
      ] },
      { title: "Recruiting", items: [
        { title: "Recruiting SOP", status: "Needs content" },
        { title: "Interview Guidelines", status: "Needs content" },
        { title: "Blank Offer Letter Template", status: "Needs content" },
        { title: "Recruiting Procedures", status: "Needs content" },
      ] },
    ],
  },
  "clinical-compliance": {
    slug: "clinical-compliance",
    title: "Clinical/Compliance",
    description: "Clinical information and reference materials for care teams.",
    groups: [
      { title: "Resource & Informational Guides", items: [
        { title: "Nutrition Guidelines", status: "Needs content" },
        { title: "Disease Information", status: "Needs content" },
        { title: "Disease-Specific Processes", status: "Needs content" },
      ] },
    ],
  },
};

export const categoryOrder = ["operations", "sales-marketing", "hr-recruiting", "clinical-compliance"] as const;
