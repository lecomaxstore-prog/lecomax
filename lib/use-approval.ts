"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type SubmitChangeOptions = {
  action: "create" | "update" | "delete";
  entity_type: "product" | "banner" | "announcement" | "promotion" | "coupon" | "page" | "category" | "newsletter" | "other";
  entity_id?: string;
  /** Human-readable summary, e.g. "Création produit : Nike Air Max 90" */
  description: string;
  /** Full data payload (will be auto-applied on approval if api_endpoint is set) */
  payload?: Record<string, unknown>;
  /** Internal API route to auto-apply the change, e.g. "/api/products" */
  api_endpoint?: string;
  /** HTTP method for auto-apply, e.g. "POST" or "PATCH" */
  api_method?: string;
  /** URL of a preview image to show in the approval queue */
  preview_image?: string;
};

type HookReturn = {
  /** True if the logged-in user is a staff member (not the owner) */
  isStaff: boolean;
  /** Email of the current user */
  userEmail: string;
  /** Display name of the current user */
  userName: string;
  /** True once auth + permissions have both resolved */
  ready: boolean;
  /**
   * Submit a change for owner approval.
   * Returns `{ submitted: true }` on success, `{ submitted: false, error }` on failure.
   */
  submitForApproval: (opts: SubmitChangeOptions) => Promise<{ submitted: boolean; error?: string }>;
};

/**
 * Hook for staff approval workflow.
 *
 * Usage in any admin page:
 * ```tsx
 * const { isStaff, submitForApproval } = useApproval();
 *
 * async function handleSave() {
 *   if (isStaff) {
 *     const { submitted, error } = await submitForApproval({
 *       action: "create",
 *       entity_type: "product",
 *       description: `Création produit : ${productName}`,
 *       payload: formData,
 *       api_endpoint: "/api/products",
 *       api_method: "POST",
 *       preview_image: productImageUrl,
 *     });
 *     if (submitted) {
 *       showToast("Votre modification a été soumise pour approbation.");
 *     }
 *   } else {
 *     // Owner → apply directly
 *     await fetch("/api/products", { method: "POST", body: JSON.stringify(formData) });
 *   }
 * }
 * ```
 */
export function useApproval(): HookReturn {
  const [isStaff, setIsStaff] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveAdminIdentity() {
      try {
        let email = "";
        let name = "";

        // The signed HttpOnly admin cookie is the primary session used by the
        // middleware and admin APIs. It must also drive the approval workflow.
        const verifyResponse = await fetch("/api/admin/auth/verify/", {
          cache: "no-store",
        });
        if (verifyResponse.ok) {
          const verified = await verifyResponse.json() as { email?: unknown };
          if (typeof verified.email === "string") email = verified.email;
        }

        // Keep Supabase as a legacy fallback, but never let it block readiness.
        if (!email) {
          const { data: { user } } = await supabase.auth.getUser();
          email = user?.email ?? "";
          name = typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : "";
        }
        if (!email) return;

        const permissionsResponse = await fetch(
          `/api/admin/staff/permissions/?email=${encodeURIComponent(email)}&v=3`,
          { cache: "no-store" }
        );
        if (!permissionsResponse.ok) throw new Error("Unable to resolve admin permissions");
        const permissions = await permissionsResponse.json() as { isStaff?: unknown };
        if (cancelled) return;

        setUserEmail(email);
        setUserName(name || email.split("@")[0]);
        setIsStaff(permissions.isStaff === true);
      } catch {
        // The page can still show a recoverable data error; readiness must not
        // remain stuck on an infinite spinner.
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void resolveAdminIdentity();
    return () => { cancelled = true; };
  }, []);

  async function submitForApproval(opts: SubmitChangeOptions) {
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_email:   userEmail,
          staff_name:    userName,
          action:        opts.action,
          entity_type:   opts.entity_type,
          entity_id:     opts.entity_id,
          description:   opts.description,
          payload:       opts.payload,
          api_endpoint:  opts.api_endpoint,
          api_method:    opts.api_method,
          preview_image: opts.preview_image,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { submitted: false, error: body.error || "Erreur lors de la soumission" };
      }
      return { submitted: true };
    } catch (e) {
      return { submitted: false, error: String(e) };
    }
  }

  return { isStaff, userEmail, userName, ready, submitForApproval };
}
