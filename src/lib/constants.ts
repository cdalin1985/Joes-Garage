import type {
  AppointmentStatus,
  EstimateStatus,
  InvoiceStatus,
  LineItemType,
  PaymentMethod,
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

export const WORK_ORDER_STATUS_FLOW: WorkOrderStatus[] = [
  "intake",
  "scheduled",
  "in_progress",
  "awaiting_parts",
  "awaiting_approval",
  "completed",
  "delivered",
];
