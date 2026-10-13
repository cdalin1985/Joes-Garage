import type {
  AppointmentStatus,
  AssetCategory,
  CommunicationType,
  EntityType,
  EstimateStatus,
  FilingStatus,
  InspectionRating,
  InvoiceStatus,
  LineItemType,
  PaymentMethod,
  PurchaseOrderStatus,
  UserRole,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@/lib/database.types";

type BadgeTone = "gray" | "blue" | "green" | "amber" | "red" | "purple" | "slate";

export const BADGE_TONES: Record<BadgeTone, string> = {
  gray: "bg-slate-100 text-slate-600",
  slate: "bg-slate-200 text-slate-700",
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-accent-100 text-accent-800",
  red: "bg-red-100 text-red-700",
  purple: "bg-violet-100 text-violet-700",
};

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "gray" },
  sent: { label: "Sent", tone: "blue" },
  partial: { label: "Partially Paid", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  overdue: { label: "Overdue", tone: "red" },
  void: { label: "Void", tone: "slate" },
};

export const ESTIMATE_STATUS: Record<EstimateStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "gray" },
  sent: { label: "Sent", tone: "blue" },
  approved: { label: "Approved", tone: "green" },
  declined: { label: "Declined", tone: "red" },
  expired: { label: "Expired", tone: "slate" },
  converted: { label: "Converted", tone: "purple" },
};

export const WORK_ORDER_STATUS: Record<WorkOrderStatus, { label: string; tone: BadgeTone }> = {
  estimate: { label: "Estimate", tone: "gray" },
  scheduled: { label: "Scheduled", tone: "blue" },
  intake: { label: "Intake", tone: "blue" },
  in_progress: { label: "In Progress", tone: "amber" },
  awaiting_parts: { label: "Awaiting Parts", tone: "purple" },
  awaiting_approval: { label: "Awaiting Approval", tone: "purple" },
  completed: { label: "Completed", tone: "green" },
  delivered: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "slate" },
};

export const WORK_ORDER_PRIORITY: Record<WorkOrderPriority, { label: string; tone: BadgeTone }> = {
  low: { label: "Low", tone: "gray" },
  normal: { label: "Normal", tone: "blue" },
  high: { label: "High", tone: "amber" },
  urgent: { label: "Urgent", tone: "red" },
};

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Scheduled", tone: "blue" },
  confirmed: { label: "Confirmed", tone: "purple" },
  in_shop: { label: "In Shop", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
  no_show: { label: "No Show", tone: "red" },
  cancelled: { label: "Cancelled", tone: "slate" },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  mechanic: "Mechanic",
  front_desk: "Front Desk",
};

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  check: "Check",
  ach: "ACH / Bank",
  financing: "Financing",
  other: "Other",
};

export const LINE_ITEM_TYPES: Record<LineItemType, string> = {
  labor: "Labor",
  part: "Part",
  sublet: "Sublet",
  fee: "Fee",
  discount: "Discount",
};

export const ENTITY_TYPES: Record<EntityType, { label: string; form: string }> = {
  sole_prop: { label: "Sole proprietor", form: "Schedule C (Form 1040)" },
  single_llc: { label: "Single-member LLC", form: "Schedule C (Form 1040)" },
  partnership: { label: "Partnership", form: "Form 1065 + K-1" },
  multi_llc: { label: "Multi-member LLC", form: "Form 1065 + K-1" },
  s_corp: { label: "S corporation", form: "Form 1120-S + K-1" },
  c_corp: { label: "C corporation", form: "Form 1120" },
};

export const FILING_STATUSES: Record<FilingStatus, string> = {
  single: "Single",
  mfj: "Married filing jointly",
  mfs: "Married filing separately",
  hoh: "Head of household",
  qw: "Qualifying surviving spouse",
};

export const ASSET_CATEGORIES: Record<AssetCategory, { label: string; years: number }> = {
  vehicle: { label: "Vehicle", years: 5 },
  machinery: { label: "Machinery / lifts", years: 7 },
  tools: { label: "Tools & shop equipment", years: 7 },
  computers: { label: "Computers & software", years: 5 },
  furniture: { label: "Furniture & fixtures", years: 7 },
  building: { label: "Building", years: 39 },
  improvement: { label: "Leasehold improvement", years: 15 },
  other: { label: "Other", years: 7 },
};

export const INSPECTION_RATING: Record<InspectionRating, { label: string; tone: BadgeTone; dot: string }> = {
  green: { label: "Good", tone: "green", dot: "bg-emerald-500" },
  yellow: { label: "Needs attention soon", tone: "amber", dot: "bg-amber-500" },
  red: { label: "Needs attention now", tone: "red", dot: "bg-red-500" },
  na: { label: "Not inspected", tone: "gray", dot: "bg-slate-300" },
};

export const PURCHASE_ORDER_STATUS: Record<PurchaseOrderStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "gray" },
  ordered: { label: "Ordered", tone: "blue" },
  partial: { label: "Partially received", tone: "amber" },
  received: { label: "Received", tone: "green" },
  cancelled: { label: "Cancelled", tone: "slate" },
};

export const COMMUNICATION_TYPES: Record<CommunicationType, string> = {
  call: "Phone call",
  text: "Text message",
  email: "Email",
  note: "Note",
};

export const WORK_ORDER_STATUS_FLOW: WorkOrderStatus[] = [
  "intake",
  "scheduled",
  "in_progress",
  "awaiting_parts",
  "awaiting_approval",
  "completed",
  "delivered",
];
