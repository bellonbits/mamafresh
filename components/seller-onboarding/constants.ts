export const BUSINESS_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "company", label: "Company" },
  { value: "cooperative", label: "Cooperative" },
];

export const SELLER_AREAS = [
  { value: "Kasarani", label: "Kasarani" },
  { value: "Roysambu", label: "Roysambu" },
  { value: "Zimmerman", label: "Zimmerman" },
  { value: "Mwiki", label: "Mwiki" },
  { value: "Kilimani", label: "Kilimani" },
  { value: "Westlands", label: "Westlands" },
  { value: "Nyali", label: "Nyali" },
  { value: "Ntinda", label: "Ntinda" },
  { value: "Mikocheni", label: "Mikocheni" },
  { value: "Kimihurura", label: "Kimihurura" },
  { value: "__other__", label: "Other (type your area)" },
];

export const COUNTIES = [
  { value: "Nairobi", label: "Nairobi, Kenya" },
  { value: "Mombasa", label: "Mombasa, Kenya" },
  { value: "Kisumu", label: "Kisumu, Kenya" },
  { value: "Kiambu", label: "Kiambu, Kenya" },
  { value: "Kampala", label: "Kampala, Uganda" },
  { value: "Dar es Salaam", label: "Dar es Salaam, Tanzania" },
  { value: "Kigali", label: "Kigali, Rwanda" },
  { value: "Other", label: "Other" },
];

export const PRODUCT_UNITS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "piece", label: "piece" },
  { value: "bunch", label: "bunch" },
  { value: "tray", label: "tray" },
  { value: "crate", label: "crate" },
  { value: "litre", label: "litre" },
  { value: "packet", label: "packet" },
];

// Kenya (+254), Uganda (+256), Tanzania (+255), Rwanda (+250) mobile numbers,
// plus the local "0"-prefixed format used domestically in all four.
export const EAST_AFRICA_PHONE_REGEX = /^(?:\+254|\+255|\+256|\+250|0)\d{9}$/;

export function isValidEastAfricanPhone(value: string): boolean {
  return EAST_AFRICA_PHONE_REGEX.test(value.replace(/\s+/g, ""));
}
