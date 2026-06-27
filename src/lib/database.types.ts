/**
 * Hand-authored database types matching supabase/migrations/*.sql.
 * When the project is connected you can regenerate these with:
 *   supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "admin" | "mechanic" | "front_desk";
export type LineItemType = "labor" | "part" | "sublet" | "fee" | "discount";
export type EstimateStatus =
  | "draft"
  | "sent"
  | "approved"
  | "declined"
  | "expired"
  | "converted";
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partial"
  | "paid"
  | "overdue"
  | "void";
export type PaymentMethod =
  | "cash"
  | "card"
  | "check"
  | "ach"
  | "financing"
  | "other";
export type WorkOrderStatus =
  | "estimate"
  | "scheduled"
  | "intake"
  | "in_progress"
  | "awaiting_parts"
  | "awaiting_approval"
  | "completed"
  | "delivered"
  | "cancelled";
export type WorkOrderPriority = "low" | "normal" | "high" | "urgent";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_shop"
  | "completed"
  | "no_show"
  | "cancelled";
export type EntityType =
  | "sole_prop"
  | "single_llc"
  | "partnership"
  | "multi_llc"
  | "s_corp"
  | "c_corp";
export type FilingStatus = "single" | "mfj" | "mfs" | "hoh" | "qw";
export type AccountingMethod = "cash" | "accrual";
export type MileageMethod = "standard" | "actual";
export type AssetCategory =
  | "vehicle"
  | "machinery"
  | "tools"
  | "computers"
  | "furniture"
  | "building"
  | "improvement"
  | "other";
export type InspectionStatus = "in_progress" | "completed";
export type InspectionRating = "green" | "yellow" | "red" | "na";
export type PurchaseOrderStatus = "draft" | "ordered" | "partial" | "received" | "cancelled";
export type CommunicationType = "call" | "text" | "email" | "note";
export type CommunicationDirection = "outbound" | "inbound";

type Timestamps = { created_at: string; updated_at: string };

export interface Profile extends Timestamps {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  hourly_rate: number | null;
  is_active: boolean;
}

export interface ShopSettings extends Timestamps {
  id: number;
  shop_name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  logo_url: string | null;
  default_tax_rate: number;
  default_labor_rate: number;
  invoice_prefix: string;
  estimate_prefix: string;
  work_order_prefix: string;
  invoice_terms: string | null;
  estimate_terms: string | null;
  ein: string | null;
  tax_id: string | null;
}

export interface Customer extends Timestamps {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  customer_type: "individual" | "fleet" | "commercial";
  tax_exempt: boolean;
  preferred_contact: "phone" | "email" | "text" | "any";
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
}

export interface Vehicle extends Timestamps {
  id: string;
  customer_id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vin: string | null;
  license_plate: string | null;
  license_state: string | null;
  color: string | null;
  mileage: number | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  unit_number: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface LineItem {
  id: string;
  item_type: LineItemType;
  description: string;
  part_id: string | null;
  quantity: number;
  unit_price: number;
  taxable: boolean;
  line_total: number;
  sort_order: number;
  created_at: string;
}

export interface EstimateItem extends LineItem {
  estimate_id: string;
}
export interface InvoiceItem extends LineItem {
  invoice_id: string;
}
export interface WorkOrderItem extends LineItem {
  work_order_id: string;
  technician_id: string | null;
  is_complete: boolean;
}

interface MoneyDoc extends Timestamps {
  id: string;
  number: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  subtotal: number;
  discount_total: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  created_by: string | null;
}

export interface Estimate extends MoneyDoc {
  status: EstimateStatus;
  issue_date: string;
  expiry_date: string | null;
  customer_concern: string | null;
}

export interface Invoice extends MoneyDoc {
  estimate_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  amount_paid: number;
  balance_due: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paid_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WorkOrder extends Timestamps {
  id: string;
  number: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assigned_to: string | null;
  customer_concern: string | null;
  diagnosis: string | null;
  work_performed: string | null;
  recommendations: string | null;
  odometer_in: number | null;
  odometer_out: number | null;
  promised_at: string | null;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimate_id: string | null;
  invoice_id: string | null;
  notes: string | null;
  created_by: string | null;
}

export interface Vendor extends Timestamps {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  account_number: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  is_1099: boolean;
  tax_id: string | null;
  tax_id_type: string | null;
  legal_name: string | null;
  w9_on_file: boolean;
}

export interface Part extends Timestamps {
  id: string;
  part_number: string | null;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  vendor_id: string | null;
  cost: number;
  price: number;
  quantity_on_hand: number;
  reorder_level: number;
  bin_location: string | null;
  taxable: boolean;
  is_active: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  schedule_c_line: string | null;
  tax_deductible: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Expense extends Timestamps {
  id: string;
  expense_date: string;
  vendor_id: string | null;
  vendor_name: string | null;
  category_id: string | null;
  amount: number;
  tax_amount: number;
  payment_method: PaymentMethod;
  reference: string | null;
  description: string | null;
  receipt_url: string | null;
  work_order_id: string | null;
  is_billable: boolean;
  created_by: string | null;
}

export interface Appointment extends Timestamps {
  id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  work_order_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: AppointmentStatus;
  start_time: string;
  end_time: string | null;
  created_by: string | null;
}

export interface TaxProfile extends Timestamps {
  id: number;
  entity_type: EntityType;
  legal_business_name: string | null;
  dba_name: string | null;
  ein: string | null;
  owner_ssn_last4: string | null;
  naics_code: string | null;
  business_description: string | null;
  business_start_date: string | null;
  state_of_operation: string | null;
  state_tax_id: string | null;
  state_unemployment_id: string | null;
  accounting_method: AccountingMethod;
  first_year_filing: boolean;
  materially_participates: boolean;
  has_employees: boolean;
  files_1099: boolean;
  made_payments_req_1099: boolean | null;
  owner_full_name: string | null;
  filing_status: FilingStatus;
  spouse_name: string | null;
  spouse_w2_income: number;
  other_household_income: number;
  dependents: number;
  prior_year_agi: number;
  prior_year_total_tax: number;
  est_other_deductions: number;
  use_itemized: boolean;
  itemized_deductions: number;
  sep_simple_401k_contrib: number;
  health_insurance_premium: number;
  hsa_contribution: number;
  has_home_office: boolean;
  home_office_sqft: number;
  home_total_sqft: number;
  home_office_use_simplified: boolean;
  home_rent_mortgage_year: number;
  home_utilities_year: number;
  home_insurance_year: number;
  home_repairs_year: number;
  vehicle_description: string | null;
  vehicle_in_service_date: string | null;
  vehicle_method: MileageMethod;
  vehicle_total_miles: number;
  vehicle_commute_miles: number;
  vehicle_actual_expenses: number;
  vehicle_has_another: boolean;
  pay_state_estimates: boolean;
  state_tax_rate: number;
  safe_harbor_target: number;
  notes: string | null;
}

export interface EstimatedTaxPayment extends Timestamps {
  id: string;
  tax_year: number;
  quarter: number;
  jurisdiction: string;
  amount: number;
  paid_date: string | null;
  confirmation: string | null;
  notes: string | null;
  created_by: string | null;
}

export interface MileageLog extends Timestamps {
  id: string;
  trip_date: string;
  miles: number;
  purpose: string | null;
  from_location: string | null;
  to_location: string | null;
  odometer_start: number | null;
  odometer_end: number | null;
  work_order_id: string | null;
  created_by: string | null;
}

export interface AssetPurchase extends Timestamps {
  id: string;
  description: string;
  category: AssetCategory;
  vendor_name: string | null;
  purchase_date: string;
  cost: number;
  business_use_pct: number;
  recovery_years: number;
  section_179: boolean;
  bonus_depreciation: boolean;
  disposed_date: string | null;
  notes: string | null;
  created_by: string | null;
}

export interface Inspection extends Timestamps {
  id: string;
  work_order_id: string;
  vehicle_id: string | null;
  status: InspectionStatus;
  share_token: string;
  performed_by: string | null;
  notes: string | null;
}

export interface InspectionItem {
  id: string;
  inspection_id: string;
  category: string;
  label: string;
  rating: InspectionRating;
  notes: string | null;
  photo_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface PurchaseOrder extends Timestamps {
  id: string;
  number: string | null;
  vendor_id: string | null;
  status: PurchaseOrderStatus;
  ordered_at: string | null;
  expected_at: string | null;
  received_at: string | null;
  notes: string | null;
  created_by: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  part_id: string | null;
  description: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
  sort_order: number;
  created_at: string;
}

export interface LaborPreset extends Timestamps {
  id: string;
  name: string;
  category: string | null;
  default_hours: number;
  default_rate: number | null;
  notes: string | null;
  is_active: boolean;
}

export interface CustomerCommunication {
  id: string;
  customer_id: string;
  work_order_id: string | null;
  appointment_id: string | null;
  type: CommunicationType;
  direction: CommunicationDirection;
  summary: string;
  logged_by: string | null;
  created_at: string;
}

// Generic table mapping for the Supabase generic client.
type Row<T> = T;
type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;
type TableDef<T> = { Row: Row<T>; Insert: Insert<T>; Update: Update<T> };

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      shop_settings: TableDef<ShopSettings>;
      customers: TableDef<Customer>;
      vehicles: TableDef<Vehicle>;
      estimates: TableDef<Estimate>;
      estimate_items: TableDef<EstimateItem>;
      invoices: TableDef<Invoice>;
      invoice_items: TableDef<InvoiceItem>;
      payments: TableDef<Payment>;
      work_orders: TableDef<WorkOrder>;
      work_order_items: TableDef<WorkOrderItem>;
      vendors: TableDef<Vendor>;
      parts: TableDef<Part>;
      expense_categories: TableDef<ExpenseCategory>;
      expenses: TableDef<Expense>;
      appointments: TableDef<Appointment>;
      tax_profile: TableDef<TaxProfile>;
      estimated_tax_payments: TableDef<EstimatedTaxPayment>;
      mileage_logs: TableDef<MileageLog>;
      asset_purchases: TableDef<AssetPurchase>;
      inspections: TableDef<Inspection>;
      inspection_items: TableDef<InspectionItem>;
      purchase_orders: TableDef<PurchaseOrder>;
      purchase_order_items: TableDef<PurchaseOrderItem>;
      labor_presets: TableDef<LaborPreset>;
      customer_communications: TableDef<CustomerCommunication>;
    };
    Views: {
      [key: string]: { Row: Record<string, unknown> };
    };
    Functions: Record<string, unknown>;
    Enums: {
      user_role: UserRole;
      line_item_type: LineItemType;
      estimate_status: EstimateStatus;
      invoice_status: InvoiceStatus;
      payment_method: PaymentMethod;
      work_order_status: WorkOrderStatus;
      work_order_priority: WorkOrderPriority;
      appointment_status: AppointmentStatus;
      entity_type: EntityType;
      filing_status: FilingStatus;
      accounting_method: AccountingMethod;
      mileage_method: MileageMethod;
      asset_category: AssetCategory;
      inspection_status: InspectionStatus;
      inspection_rating: InspectionRating;
      purchase_order_status: PurchaseOrderStatus;
      communication_type: CommunicationType;
      communication_direction: CommunicationDirection;
    };
  };
}
