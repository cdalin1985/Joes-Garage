import type { Customer, Vehicle } from "@/lib/database.types";

export function customerName(c: Partial<Customer> | null | undefined): string {
  if (!c) return "—";
  const full = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return full || c.company || "Unnamed Customer";
}

export function customerSubtitle(c: Partial<Customer> | null | undefined): string {
  if (!c) return "";
  // If we showed a person's name, the company is the subtitle and vice-versa.
  const hasName = Boolean(c.first_name || c.last_name);
  if (hasName && c.company) return c.company;
  return [c.phone, c.email].filter(Boolean).join(" · ");
}

export function vehicleName(v: Partial<Vehicle> | null | undefined): string {
  if (!v) return "—";
  const parts = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ").trim();
  return parts || "Vehicle";
}

export function vehicleSubtitle(v: Partial<Vehicle> | null | undefined): string {
  if (!v) return "";
  return [v.license_plate && `Plate ${v.license_plate}`, v.vin && `VIN ${v.vin}`]
    .filter(Boolean)
    .join(" · ");
}
