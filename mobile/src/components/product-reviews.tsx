import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { palette, typography } from "@/constants/theme";
import {
  getReviewEligibility,
  submitVerifiedReview,
  type ReviewEligibility,
} from "@/services/catalog";
import type { Review } from "@/types/commerce";

type Props = {
  slug: string;
  reviews: Review[];
  productRating?: number;
  productReviewCount?: number;
  selectedColor?: string;
  onSubmitted: () => Promise<unknown>;
};

const reasonMessages: Record<ReviewEligibility["reason"], string> = {
  verified_purchase: "Votre achat est vérifié. Partagez votre expérience.",
  signed_out: "Connectez-vous avec l’adresse utilisée lors de votre commande.",
  not_ordered: "Les avis sont réservés aux clients ayant acheté ce produit.",
  not_delivered:
    "Vous pourrez publier un avis dès que votre commande sera livrée.",
  already_reviewed: "Vous avez déjà publié un avis pour ce produit.",
};

function containsArabic(value: string | null | undefined) {
  return Boolean(value && /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(value));
}

function Stars({
  value,
  size = 16,
  interactive = false,
  onChange,
}: {
  value: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) =>
        interactive ? (
          <AnimatedPressable
            key={star}
            accessibilityLabel={`${star} star${star === 1 ? "" : "s"}`}
            onPress={() => onChange?.(star)}
            pressedScale={0.86}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= value ? "star" : "star-outline"}
              size={size}
              color={star <= value ? palette.gold : "#B8B8B8"}
            />
          </AnimatedPressable>
        ) : (
          <Ionicons
            key={star}
            name={star <= Math.round(value) ? "star" : "star-outline"}
            size={size}
            color={star <= Math.round(value) ? palette.gold : "#D1D1D1"}
          />
        ),
      )}
    </View>
  );
}

export const ProductReviews = memo(function ProductReviews({
  slug,
  reviews,
  productRating = 4.8,
  productReviewCount = 0,
  selectedColor,
  onSubmitted,
}: Props) {
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(
    null,
  );
  const [checking, setChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    void getReviewEligibility(slug)
      .then((result) => {
        if (active) setEligibility(result);
      })
      .catch(() => {
        if (active) setEligibility({ canReview: false, reason: "signed_out" });
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const total = reviews.length || productReviewCount;
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : productRating;
  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((review) => review.rating === star).length,
        percent: reviews.length
          ? (reviews.filter((review) => review.rating === star).length /
              reviews.length) *
            100
          : 0,
      })),
    [reviews],
  );

  const submit = async () => {
    setError(null);
    if (!rating || body.trim().length < 20) {
      setError("Choisissez une note et écrivez au moins 20 caractères.");
      return;
    }
    setSubmitting(true);
    try {
      await submitVerifiedReview({
        productSlug: slug,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
        color: selectedColor,
      });
      setSuccess(true);
      setShowForm(false);
      setEligibility({ canReview: false, reason: "already_reviewed" });
      await onSubmitted();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible de publier votre avis.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>COMMUNAUTÉ LECOMAX</Text>
          <Text style={styles.heading}>Avis clients</Text>
        </View>
        <View style={styles.verifiedHeader}>
          <Ionicons name="shield-checkmark" size={15} color={palette.green} />
          <Text style={styles.verifiedHeaderText}>ACHATS VÉRIFIÉS</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>{average.toFixed(1)}</Text>
          <Stars value={average} size={15} />
          <Text style={styles.scoreCount}>
            {total} avis vérifié{total === 1 ? "" : "s"}
          </Text>
        </View>
        <View style={styles.distribution}>
          {distribution.map((row) => (
            <View key={row.star} style={styles.distributionRow}>
              <Text style={styles.distributionLabel}>{row.star}</Text>
              <Ionicons name="star" size={10} color={palette.gold} />
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${row.percent}%` }]} />
              </View>
              <Text style={styles.distributionCount}>{row.count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.eligibilityCard}>
        <View style={styles.eligibilityIcon}>
          <Ionicons
            name={eligibility?.canReview ? "checkmark" : "receipt-outline"}
            size={20}
            color={palette.green}
          />
        </View>
        <View style={styles.eligibilityCopy}>
          <Text style={styles.eligibilityTitle}>
            {eligibility?.canReview
              ? "Votre achat est confirmé"
              : "Avis authentiques uniquement"}
          </Text>
          <Text style={styles.eligibilityMessage}>
            {checking
              ? "Vérification de votre compte…"
              : reasonMessages[eligibility?.reason ?? "signed_out"]}
          </Text>
        </View>
        {checking ? (
          <ActivityIndicator color={palette.green} />
        ) : eligibility?.reason === "signed_out" ? (
          <AnimatedPressable
            accessibilityLabel="Se connecter pour laisser un avis"
            onPress={() => router.push("/auth")}
            style={styles.smallAction}
          >
            <Text style={styles.smallActionText}>SE CONNECTER</Text>
          </AnimatedPressable>
        ) : eligibility?.canReview ? (
          <AnimatedPressable
            accessibilityLabel={
              showForm ? "Fermer le formulaire d’avis" : "Écrire un avis"
            }
            onPress={() => setShowForm((value) => !value)}
            style={styles.smallAction}
          >
            <Text style={styles.smallActionText}>
              {showForm ? "FERMER" : "ÉCRIRE"}
            </Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {showForm && eligibility?.canReview ? (
        <Animated.View entering={FadeInUp.duration(320)} style={styles.form}>
          <Text style={styles.formTitle}>Votre expérience</Text>
          <Text style={styles.formHint}>
            Touchez une étoile pour noter le produit.
          </Text>
          <View style={styles.ratingPicker}>
            <Stars value={rating} size={30} interactive onChange={setRating} />
            <Text style={styles.ratingValue}>
              {rating ? `${rating}/5` : "Votre note"}
            </Text>
          </View>
          <TextInput
            accessibilityLabel="Titre de l’avis"
            value={title}
            onChangeText={setTitle}
            placeholder="Titre de votre avis (facultatif)"
            placeholderTextColor="#9A9A9A"
            maxLength={100}
            style={styles.titleInput}
          />
          <TextInput
            accessibilityLabel="Contenu de l’avis"
            value={body}
            onChangeText={setBody}
            placeholder="Confort, qualité, taille… qu’avez-vous pensé du produit ?"
            placeholderTextColor="#9A9A9A"
            multiline
            maxLength={1200}
            textAlignVertical="top"
            style={styles.bodyInput}
          />
          <View style={styles.formFooter}>
            <Text style={styles.characterCount}>{body.length}/1200</Text>
            <AnimatedPressable
              accessibilityLabel="Publier l’avis"
              disabled={submitting}
              onPress={() => void submit()}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={palette.white} />
              ) : (
                <>
                  <Text style={styles.submitText}>PUBLIER L’AVIS</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={palette.white}
                  />
                </>
              )}
            </AnimatedPressable>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Animated.View>
      ) : null}

      {success ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.success}>
          <Ionicons name="checkmark-circle" size={20} color={palette.green} />
          <Text style={styles.successText}>
            Merci. Votre avis vérifié a été publié.
          </Text>
        </Animated.View>
      ) : null}

      <View style={styles.reviewList}>
        {reviews.length ? (
          reviews.map((review, index) => {
            const bodyIsRtl = containsArabic(review.body);
            const titleIsRtl = containsArabic(review.title);
            return (
            <Animated.View
              key={review.id}
              entering={FadeInUp.delay(index * 60).duration(320)}
              style={styles.reviewCard}
            >
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {review.author_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.author}>
                  <Text style={styles.authorName}>{review.author_name}</Text>
                  <Text style={styles.reviewDate}>
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(review.created_at))}
                  </Text>
                </View>
                {review.verified_purchase !== false ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={13}
                      color={palette.green}
                    />
                    <Text style={styles.verifiedText}>ACHAT VÉRIFIÉ</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.reviewRatingRow}>
                <Stars value={review.rating} size={15} />
                <Text style={styles.reviewRatingValue}>{review.rating.toFixed(1)}</Text>
              </View>
              {review.title ? (
                <Text style={[styles.reviewTitle, titleIsRtl && styles.rtlText]}>{review.title}</Text>
              ) : null}
              <Text style={[styles.reviewBody, bodyIsRtl && styles.rtlText]}>{review.body}</Text>
              {review.admin_reply ? (
                <View style={styles.reply}>
                  <Text style={styles.replyLabel}>RÉPONSE DE LECOMAX</Text>
                  <Text style={styles.replyText}>{review.admin_reply}</Text>
                </View>
              ) : null}
            </Animated.View>
            );
          })
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={25}
                color={palette.green}
              />
            </View>
            <Text style={styles.emptyTitle}>Aucun avis pour le moment</Text>
            <Text style={styles.emptyText}>
              Le premier avis apparaîtra après un achat et une livraison
              vérifiés.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 34,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.white,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    color: palette.green,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.8,
  },
  heading: {
    marginTop: 7,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 28,
    letterSpacing: -1,
  },
  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingBottom: 4,
  },
  verifiedHeaderText: {
    color: palette.green,
    fontFamily: typography.bold,
    fontSize: 8,
    letterSpacing: 1,
  },
  summary: {
    marginTop: 24,
    padding: 20,
    borderRadius: 24,
    flexDirection: "row",
    backgroundColor: palette.canvas,
  },
  score: { width: "42%", justifyContent: "center" },
  scoreValue: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -2.5,
  },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  starButton: { padding: 2 },
  scoreCount: {
    marginTop: 7,
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 10,
  },
  distribution: { flex: 1, gap: 5 },
  distributionRow: {
    height: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distributionLabel: {
    width: 8,
    color: palette.muted,
    fontFamily: typography.bold,
    fontSize: 9,
  },
  track: {
    flex: 1,
    height: 5,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "#DEDEDE",
  },
  fill: { height: "100%", borderRadius: 3, backgroundColor: palette.ink },
  distributionCount: {
    width: 12,
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 8,
    textAlign: "right",
  },
  eligibilityCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CFE8D8",
    backgroundColor: "#EFF9F3",
  },
  eligibilityIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
  },
  eligibilityCopy: { minWidth: 0, flex: 1, marginHorizontal: 10 },
  eligibilityTitle: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  eligibilityMessage: {
    marginTop: 3,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 9,
    lineHeight: 13,
  },
  smallAction: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: palette.ink,
  },
  smallActionText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  form: {
    marginTop: 16,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
  },
  formTitle: { color: palette.ink, fontFamily: typography.black, fontSize: 19 },
  formHint: {
    marginTop: 4,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 10,
  },
  ratingPicker: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingValue: {
    color: palette.muted,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  titleInput: {
    height: 50,
    marginTop: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DEDEDE",
    color: palette.ink,
    fontFamily: typography.medium,
    fontSize: 12,
    backgroundColor: palette.canvas,
  },
  bodyInput: {
    height: 122,
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DEDEDE",
    color: palette.ink,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: palette.canvas,
  },
  formFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  characterCount: {
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 9,
  },
  submitButton: {
    minWidth: 142,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: palette.ink,
  },
  submitText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1,
  },
  error: {
    marginTop: 12,
    color: palette.red,
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  success: {
    marginTop: 15,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EAF8F0",
  },
  successText: {
    color: palette.greenDark,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  reviewList: { marginTop: 22, gap: 12 },
  reviewCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E1E3E0",
    backgroundColor: palette.white,
    shadowColor: "#19201A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.055,
    shadowRadius: 13,
    elevation: 2,
  },
  reviewHeader: {
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.ink,
  },
  avatarText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 14,
  },
  author: { minWidth: 0, flex: 1, marginLeft: 10 },
  authorName: { color: palette.ink, fontFamily: typography.bold, fontSize: 12 },
  reviewDate: {
    marginTop: 2,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 9,
  },
  verifiedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#D2EFDC",
    backgroundColor: "#EFFBF3",
  },
  verifiedText: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.5,
  },
  reviewTitle: {
    marginTop: 13,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  reviewBody: {
    marginTop: 7,
    color: "#555B57",
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 20,
  },
  reviewRatingRow: {
    minHeight: 29,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1EF",
  },
  reviewRatingValue: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 10,
  },
  rtlText: { textAlign: "right", writingDirection: "rtl" },
  reply: {
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    backgroundColor: palette.canvas,
  },
  replyLabel: {
    color: palette.green,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 1,
  },
  replyText: {
    marginTop: 5,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 16,
  },
  empty: {
    paddingHorizontal: 24,
    paddingVertical: 34,
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D7D7D7",
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F0",
  },
  emptyTitle: {
    marginTop: 14,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 15,
  },
  emptyText: {
    maxWidth: 280,
    marginTop: 6,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
});
