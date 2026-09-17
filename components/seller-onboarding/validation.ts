import type { OnboardingForm } from "@/lib/hooks/useSellerOnboarding";
import type { ProductRow } from "@/lib/supabase/types";
import { isValidEastAfricanPhone } from "@/components/seller-onboarding/constants";

export type FieldErrors = Record<string, string>;

export function validateAccountStep(form: OnboardingForm, isNewAccount: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required.";
  if (!form.accountEmail.trim()) errors.accountEmail = "Email is required.";
  else if (!/^\S+@\S+\.\S+$/.test(form.accountEmail)) errors.accountEmail = "Enter a valid email address.";
  if (!form.accountPhone.trim()) errors.accountPhone = "Phone number is required.";
  else if (!isValidEastAfricanPhone(form.accountPhone)) errors.accountPhone = "Enter a valid phone number, e.g. 0712 345 678.";
  if (isNewAccount) {
    if (!form.password.trim()) errors.password = "Password is required.";
    else if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

export function validateSellerInfoStep(form: OnboardingForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.ownerName.trim()) errors.ownerName = "Owner name is required.";
  if (!form.sellerPhone.trim()) errors.sellerPhone = "Phone number is required.";
  else if (!isValidEastAfricanPhone(form.sellerPhone)) errors.sellerPhone = "Enter a valid phone number.";
  if (!form.sellerEmail.trim()) errors.sellerEmail = "Email is required.";
  else if (!/^\S+@\S+\.\S+$/.test(form.sellerEmail)) errors.sellerEmail = "Enter a valid email address.";
  if (!form.businessType) errors.businessType = "Business type is required.";
  return errors;
}

export function validateShopInfoStep(form: OnboardingForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.shopName.trim() || form.shopName.trim().length < 3) errors.shopName = "Shop name must be at least 3 characters.";
  if (!form.primaryCategory) errors.primaryCategory = "Shop category is required.";
  if (form.shopPhone && !isValidEastAfricanPhone(form.shopPhone)) errors.shopPhone = "Enter a valid phone number.";
  if (form.shopWhatsapp && !isValidEastAfricanPhone(form.shopWhatsapp)) errors.shopWhatsapp = "Enter a valid phone number.";
  return errors;
}

export function validateLocationStep(form: OnboardingForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.area) errors.area = "Area is required.";
  else if (form.area === "__other__" && !form.areaOther.trim()) errors.areaOther = "Enter your area.";
  if (!form.county) errors.county = "County is required.";
  return errors;
}

export function validateCategoriesStep(form: OnboardingForm): FieldErrors {
  const errors: FieldErrors = {};
  if (form.categories.length === 0) errors.categories = "Select at least one category.";
  return errors;
}

export interface ReviewIssue {
  step: number;
  label: string;
}

export function collectReviewIssues(form: OnboardingForm, products: ProductRow[], isNewAccount: boolean): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const push = (step: number, condition: boolean, label: string) => { if (condition) issues.push({ step, label }); };

  const accountErrors = validateAccountStep(form, isNewAccount);
  push(1, Object.keys(accountErrors).length > 0, "Account details");

  const sellerErrors = validateSellerInfoStep(form);
  push(2, Object.keys(sellerErrors).length > 0, "Seller information");

  const shopErrors = validateShopInfoStep(form);
  push(3, !!shopErrors.shopName, "Shop name");
  push(3, !!shopErrors.primaryCategory, "Shop category");

  const locationErrors = validateLocationStep(form);
  push(4, Object.keys(locationErrors).length > 0, "Shop location");

  const categoryErrors = validateCategoriesStep(form);
  push(5, Object.keys(categoryErrors).length > 0, "At least one shop category");

  push(6, products.length === 0, "At least one product (recommended)");

  return issues;
}
