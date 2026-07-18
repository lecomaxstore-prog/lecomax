import "server-only";

import { createClient, type User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

type ProfileReward = "avatar" | "information";

export type ProfileLoyaltyResult = {
  awarded: number;
  balance: number;
  rewards: ProfileReward[];
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasCompletedInformation(user: User) {
  const metadata = user.user_metadata ?? {};
  const phone = text(metadata.phone).replace(/[\s().-]/g, "");
  return Boolean(
    text(metadata.prenom)
    && text(metadata.nom)
    && /^(?:0[67]\d{8}|(?:\+|00)?212[67]\d{8})$/.test(phone),
  );
}

function hasAvatar(user: User) {
  const metadata = user.user_metadata ?? {};
  return /^https?:\/\//i.test(text(metadata.avatar_url ?? metadata.picture));
}

/**
 * Awards each profile reward once. Eligibility comes exclusively from the
 * persisted Auth user returned by Supabase, never from a client-side claim.
 */
export async function awardEligibleProfileRewards(user: User): Promise<ProfileLoyaltyResult> {
  const email = user.email?.trim().toLowerCase();
  if (!email) return { awarded: 0, balance: 0, rewards: [] };

  const eligible: ProfileReward[] = [];
  if (hasAvatar(user)) eligible.push("avatar");
  if (hasCompletedInformation(user)) eligible.push("information");

  let awarded = 0;
  let balance = 0;
  const rewards: ProfileReward[] = [];

  for (const reward of eligible) {
    const { data, error } = await supabase.rpc("add_loyalty_points", {
      p_email: email,
      p_amount: 10,
      p_reference: `profile:${user.id}:${reward}`,
    });
    if (error) throw error;
    const result = data as { awarded?: number; balance?: number } | null;
    const newlyAwarded = Number(result?.awarded ?? 0);
    awarded += newlyAwarded;
    balance = Number(result?.balance ?? balance);
    if (newlyAwarded > 0) rewards.push(reward);
  }

  return { awarded, balance, rewards };
}
