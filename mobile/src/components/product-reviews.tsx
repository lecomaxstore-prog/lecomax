import { formatNumber } from "@/lib/format";
import { currentLocale, msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  useWindowDimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
  verifyReviewOrder,
  type ReviewOrderProof,
} from "@/services/catalog";
import type { Review } from "@/types/commerce";

const CARD_GAP = 12;

type Props = {
  slug: string;
  reviews: Review[];
  productRating?: number;
  productReviewCount?: number;
  selectedColor?: string;
  onSubmitted: () => Promise<unknown>;
};

const reasonMessages: Record<ReviewEligibility["reason"], string> = {
  get verified_purchase() {
    return msg("productReviews.yourPurchaseIsVerifiedShareYourExperience");
  },
  get signed_out() {
    return msg("productReviews.signInWithTheEmailAddressUsedForYourOrder");
  },
  get not_ordered() {
    return msg(
      "productReviews.reviewsAreReservedForCustomersWhoPurchasedThisProduct",
    );
  },
  get not_delivered() {
    return msg("productReviews.youCanPostAReviewOnceYourOrderIsDelivered");
  },
  get already_reviewed() {
    return msg("productReviews.youHaveAlreadyReviewedThisProduct");
  },
};

function containsArabic(value: string | null | undefined) {
  return Boolean(
    value && /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(value),
  );
}

function ReviewImages({ urls }: { urls: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (urls.length === 0) return null;
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imageRow}
        style={styles.imageScroller}
      >
        {urls.map((url, i) => (
          <AnimatedPressable
            key={url}
            pressedScale={0.96}
            onPress={() => setLightbox(url)}
          >
            <Image
              source={{ uri: url }}
              style={styles.reviewImage}
              accessibilityLabel={msg("productReviews.reviewPhoto", {
                index: i + 1,
              })}
            />
          </AnimatedPressable>
        ))}
      </ScrollView>
      <Modal
        visible={!!lightbox}
        transparent
        animationType="fade"
        onRequestClose={() => setLightbox(null)}
      >
        <Pressable
          style={styles.lightboxOverlay}
          onPress={() => setLightbox(null)}
        >
          <Image
            source={{ uri: lightbox ?? "" }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
          <View style={styles.lightboxClose}>
            <Ionicons name="close" size={22} color={palette.white} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function Stars({
  value,
  size = 16,
  interactive = false,
  color = palette.gold,
  onChange,
}: {
  value: number;
  size?: number;
  interactive?: boolean;
  color?: string;
  onChange?: (value: number) => void;
}) {
  useLocale();
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) =>
        interactive ? (
          <AnimatedPressable
            key={star}
            accessibilityLabel={msg("reviews.stars", { count: star })}
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
            color={star <= Math.round(value) ? color : "#D1D1D1"}
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
  useLocale();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 40, 380);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(
    null,
  );
  const [checking, setChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [contactType, setContactType] = useState<"phone" | "email">("phone");
  const [contact, setContact] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [proof, setProof] = useState<ReviewOrderProof>();
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const verificationVersion = useRef(0);
  const invitation = useLocalSearchParams<{ order?: string }>();
  useEffect(() => {
    // Synchronize the editable order field when a review invitation changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof invitation.order === "string") setOrderNumber(invitation.order);
  }, [invitation.order]);
  const invalidateProof = () => {
    verificationVersion.current += 1;
    setProof(undefined);
    setShowForm(false);
    setVerifying(false);
    setVerificationError(null);
  };
  const verifyPurchase = useCallback(async () => {
    const version = ++verificationVersion.current;
    const candidate = {
      order_number: orderNumber,
      contact_type: contactType,
      contact,
    };
    setVerifying(true);
    setVerificationError(null);
    try {
      const result = await verifyReviewOrder(slug, candidate);
      if (version !== verificationVersion.current) return;
      if (result.canReview) {
        setProof(candidate);
        setShowForm(true);
      } else {
        setProof(undefined);
        setVerificationError(
          result.reason === "not_ordered" || result.reason === "signed_out"
            ? msg("reviewOrder.noMatch")
            : reasonMessages[result.reason],
        );
      }
    } catch {
      if (version === verificationVersion.current)
        setVerificationError(msg("reviewOrder.unavailable"));
    } finally {
      if (version === verificationVersion.current) setVerifying(false);
    }
  }, [orderNumber, contactType, contact, slug]);

  const contactReady = contactType === "email"
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
    : /^[+\d\s().-]+$/.test(contact) && (
      /^0[5-7]\d{8}$/.test(contact.replace(/\D/g, "")) ||
      /^(?:\+|00)[1-9]\d{9,14}$/.test(contact.replace(/[\s().-]/g, "")) ||
      /^212[5-7]\d{8}$/.test(contact.replace(/\D/g, ""))
    );

  useEffect(() => {
    if (!reviewOpen || eligibility?.canReview || !contactReady || success) return;
    const timer = setTimeout(() => void verifyPurchase(), 900);
    return () => {
      clearTimeout(timer);
      verificationVersion.current += 1;
    };
  }, [reviewOpen, eligibility?.canReview, contactReady, verifyPurchase, success]);

  useEffect(() => {
    let active = true;
    // A different product invalidates purchase proof and the previous review draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    invalidateProof();
    setReviewOpen(false);
    setSuccess(false);
    setEligibility(null);
    setChecking(true);
    setRating(0);
    setBody("");
    setTitle("");
    setError(null);
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
      setError(msg("productReviews.chooseARatingAndWriteAtLeast20Characters"));
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
        proof,
        authorName: authorName.trim() || undefined,
      });
      setSuccess(true);
      setProof(undefined);
      setShowForm(false);
      setEligibility({ canReview: false, reason: "already_reviewed" });
      await onSubmitted().catch(() => {});
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : msg("productReviews.unableToPublishYourReview"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>
            {msg("productReviews.lecomaxCommunityUppercase")}
          </Text>
          <Text accessibilityRole="header" style={styles.heading}>
            {msg("productReviews.customerReviews")}
          </Text>
        </View>
        <View style={styles.verifiedHeader}>
          <Ionicons name="shield-checkmark" size={15} color={palette.green} />
          <Text style={styles.verifiedHeaderText}>
            {msg("productReviews.verifiedPurchasesUppercase")}
          </Text>
        </View>
      </View>

      {total > 0 ? (
        <View style={styles.summary}>
          <View style={styles.score}>
            <Text style={styles.scoreValue}>
              {formatNumber(average, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </Text>
            <Stars value={average} size={15} />
            <Text style={styles.scoreCount}>
              {total} {msg("productReviews.verifiedReview")}
              {total === 1 ? "" : "s"}
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
      ) : (
        <View style={styles.emptySummary}>
          <View style={styles.emptySummaryIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={21}
              color="#7B8278"
            />
          </View>
          <View style={styles.emptySummaryCopy}>
            <Text style={styles.emptySummaryTitle}>
              {msg("productReviews.noReviewsYet")}
            </Text>
            <Text style={styles.emptySummaryText}>
              {msg("productReviews.beTheFirstToShareYourExperience")}
            </Text>
          </View>
        </View>
      )}

      {!success && (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={msg(reviewOpen ? "productReviews.closeReviewForm" : "productReviews.writeAReview")}
          accessibilityState={{ expanded: reviewOpen }}
          onPress={() => {
            invalidateProof();
            setError(null);
            setReviewOpen(!reviewOpen);
            setShowForm(!reviewOpen);
          }}
          style={styles.writeReviewButton}
        >
          <Ionicons name={reviewOpen ? "close-outline" : "create-outline"} size={18} color="#294331" />
          <Text style={styles.writeReviewText}>
            {msg(reviewOpen ? "productReviews.closeReviewForm" : "productReviews.writeAReview")}
          </Text>
        </AnimatedPressable>
      )}
      {reviewOpen && checking ? <ActivityIndicator style={{ marginTop: 20 }} color={palette.greenDark} /> : null}
      {reviewOpen && !checking && !eligibility?.canReview && !success && (
        <View style={styles.purchaseForm}>
          <Text style={styles.purchaseEyebrow}>{msg("reviewOrder.eyebrow")}</Text>
          <Text accessibilityRole="header" style={styles.purchaseTitle}>
            {msg("reviewOrder.title")}
          </Text>
          <Text style={styles.purchaseIntro}>{msg("reviewOrder.intro")}</Text>
          <View style={styles.contactTabs}>
            {(["phone", "email"] as const).map((type) => (
              <AnimatedPressable
                key={type}
                accessibilityRole="button"
                accessibilityState={{ selected: contactType === type }}
                accessibilityLabel={msg(
                  type === "phone"
                    ? "reviewOrder.phoneTab"
                    : "reviewOrder.emailTab",
                )}
                onPress={() => {
                  setContactType(type);
                  setContact("");
                  invalidateProof();
                }}
                style={[
                  styles.contactTab,
                  contactType === type && styles.contactTabSelected,
                ]}
              >
                <Ionicons
                  name={type === "phone" ? "call-outline" : "mail-outline"}
                  size={16}
                  color={contactType === type ? "#233B2B" : "#858980"}
                />
                <Text
                  style={[
                    styles.contactTabText,
                    contactType === type && styles.contactTabTextSelected,
                  ]}
                >
                  {msg(
                    type === "phone"
                      ? "reviewOrder.phoneTab"
                      : "reviewOrder.emailTab",
                  )}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
          <Text style={styles.purchaseLabel}>
            {msg(
              contactType === "phone"
                ? "reviewOrder.phone"
                : "reviewOrder.email",
            )}
          </Text>
          <TextInput
            accessibilityLabel={msg(
              contactType === "phone"
                ? "reviewOrder.phone"
                : "reviewOrder.email",
            )}
            value={contact}
            onChangeText={(value) => {
              setContact(value);
              invalidateProof();
            }}
            keyboardType={
              contactType === "phone" ? "phone-pad" : "email-address"
            }
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={254}
            placeholder={
              contactType === "phone"
                ? "06 12 34 56 78 / +212…"
                : "client@example.com"
            }
            placeholderTextColor="#777"
            style={[styles.titleInput, styles.purchaseInput]}
          />
          <View style={styles.purchasePrivacy}>
            <Ionicons name="lock-closed-outline" size={14} color="#73806F" />
            <Text style={styles.purchasePrivacyText}>{msg("reviewOrder.privacy")}</Text>
          </View>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={msg("reviewOrder.verify")}
            accessibilityState={{
              disabled: verifying || !contactReady || Boolean(proof),
              busy: verifying,
            }}
            disabled={verifying || !contactReady || Boolean(proof)}
            onPress={() => void verifyPurchase()}
            style={[
              styles.purchaseSubmit,
              (verifying || !contactReady) && styles.purchaseSubmitDisabled,
            ]}
          >
            {verifying ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
            <Text style={styles.purchaseSubmitText}>
              {msg(
                verifying
                  ? "reviewOrder.checking"
                  : proof
                    ? "reviewOrder.confirmed"
                    : "reviewOrder.verify",
              )}
            </Text>
          </AnimatedPressable>
          {verificationError && (
            <Text accessibilityRole="alert" style={styles.error}>
              {verificationError}
            </Text>
          )}
        </View>
      )}

      {reviewOpen && showForm && (eligibility?.canReview || proof) ? (
        <Animated.View entering={FadeInUp.duration(320)} style={styles.form}>
          <Text style={styles.formTitle}>
            {msg("productReviews.yourExperience")}
          </Text>
          {proof && (
            <TextInput
              accessibilityLabel={msg("reviewOrder.publicName")}
              value={authorName}
              onChangeText={setAuthorName}
              placeholder={msg("reviewOrder.publicName")}
              placeholderTextColor="#777"
              maxLength={60}
              style={styles.titleInput}
            />
          )}
          <Text style={styles.formHint}>
            {msg("productReviews.tapAStarToRateTheProduct")}
          </Text>
          <View style={styles.ratingPicker}>
            <Stars value={rating} size={30} interactive onChange={setRating} />
            <Text style={styles.ratingValue}>
              {rating ? `${rating}/5` : msg("productReviews.yourRating")}
            </Text>
          </View>
          <TextInput
            accessibilityLabel={msg("productReviews.reviewTitle")}
            value={title}
            onChangeText={setTitle}
            placeholder={msg("productReviews.reviewTitleOptional")}
            placeholderTextColor="#9A9A9A"
            maxLength={100}
            style={styles.titleInput}
          />
          <TextInput
            accessibilityLabel={msg("productReviews.reviewContent")}
            value={body}
            onChangeText={setBody}
            placeholder={msg(
              "productReviews.comfortQualitySizeWhatDidYouThinkOfTheProduct",
            )}
            placeholderTextColor="#9A9A9A"
            multiline
            maxLength={1200}
            textAlignVertical="top"
            style={styles.bodyInput}
          />
          <View style={styles.formFooter}>
            <Text style={styles.characterCount}>{body.length}/1200</Text>
            <AnimatedPressable
              accessibilityLabel={msg("productReviews.publishReview")}
              disabled={submitting}
              onPress={() => void submit()}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={palette.white} />
              ) : (
                <>
                  <Text style={styles.submitText}>
                    {msg("productReviews.publishReviewUppercase")}
                  </Text>
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
            {msg("productReviews.thankYouYourVerifiedReviewHasBeenPublished")}
          </Text>
        </Animated.View>
      ) : null}

      {reviews.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + CARD_GAP}
          snapToAlignment="start"
          contentContainerStyle={styles.reviewCarousel}
          style={styles.reviewScroller}
        >
          {reviews.map((review, index) => {
            const bodyIsRtl = containsArabic(review.body);
            const titleIsRtl = containsArabic(review.title);
            const reply = review.admin_reply?.trim() || "";
            const replyIsLong = reply.length > 180;
            const replyExpanded = Boolean(expandedReplies[review.id]);
            const replyCopy = replyIsLong && !replyExpanded
              ? `${reply.slice(0, 160).replace(/\s+\S*$/, "")}…`
              : reply;
            const imageUrls = review.image_urls?.length
              ? review.image_urls
              : review.image_url
                ? [review.image_url]
                : [];
            return (
              <Animated.View
                key={review.id}
                entering={FadeInUp.delay(index * 80).duration(380)}
                style={[styles.reviewCard, { width: cardWidth, paddingBottom: reply ? 0 : 18 }]}
              >
                {/* Customer identity */}
                <View style={styles.reviewFooter}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {review.author_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.footerCopy}>
                    <Text style={styles.authorName} numberOfLines={1}>
                      {review.author_name}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Intl.DateTimeFormat(currentLocale(), {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(review.created_at))}
                      {review.city ? ` · ${review.city}` : ""}
                    </Text>
                  </View>
                </View>


                <View style={styles.reviewHeaderRow}>
                  <View style={styles.ratingBadge}>
                    <Stars
                      value={review.rating}
                      size={13}
                      color={palette.gold}
                    />
                    <Text style={styles.reviewRatingValue}>
                      {formatNumber(review.rating, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </Text>
                  </View>

                  {review.verified_purchase !== false ? (
                    <View style={styles.verifiedBadgePill}>
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color="#15803D"
                      />
                      <Text style={styles.verifiedBadgeText}>
                        {msg("productReviews.verifiedPurchase")}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* ── Body (main content area with smart RTL) ── */}
                {review.title ? (
                  <Text
                    style={[styles.reviewTitle, titleIsRtl && styles.rtlText]}
                    numberOfLines={2}
                  >
                    {review.title}
                  </Text>
                ) : null}

                <View style={bodyIsRtl ? styles.arabicBodyBox : null}>
                  <Text
                    style={[styles.reviewBody, bodyIsRtl && styles.rtlText]}
                  >
                    {bodyIsRtl ? `"${review.body}"` : review.body}
                  </Text>
                </View>

                {/* ── Photos ── */}
                <ReviewImages urls={imageUrls} />

                {/* ── Admin reply ── */}
                {reply ? (
                  <View style={styles.reply}>
                    <View style={styles.replyHeader}>
                      <Image
                        source={require("../../assets/images/app-icon-shopping-v12.png")}
                        style={styles.replyIcon}
                        accessibilityIgnoresInvertColors
                      />
                      <Text style={styles.replyLabel}>L’ecomax</Text>
                      <Text style={styles.replyCaption}>{msg("productReviews.storeReply")}</Text>
                    </View>
                    <Text
                      style={[
                        styles.replyText,
                        containsArabic(review.admin_reply) && styles.rtlText,
                      ]}
                    >
                      {replyCopy}
                    </Text>
                    {replyIsLong ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ expanded: replyExpanded }}
                        onPress={() => setExpandedReplies((current) => ({
                          ...current, [review.id]: !current[review.id],
                        }))}
                        style={styles.replyToggle}
                      >
                        <Text style={styles.replyToggleText}>
                          {msg(replyExpanded ? "productReviews.showLess" : "productReviews.readReply")}
                        </Text>
                        <Ionicons name={replyExpanded ? "chevron-up" : "chevron-down"} size={13} color={palette.greenDark} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </Animated.View>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: palette.white,
  },
  headingRow: {
    alignItems: "flex-start",
    gap: 10,
  },
  eyebrow: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.8,
  },
  heading: {
    marginTop: 7,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EFF7F1",
  },
  verifiedHeaderText: {
    flexShrink: 1,
    color: palette.greenDark,
    fontFamily: typography.bold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0.6,
  },
  summary: {
    marginTop: 24,
    padding: 20,
    borderRadius: 24,
    flexDirection: "row",
    backgroundColor: palette.canvas,
  },
  emptySummary: {
    marginTop: 20,
    minHeight: 76,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DFE2DA",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  emptySummaryIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  emptySummaryCopy: { minWidth: 0, flex: 1, marginLeft: 12 },
  emptySummaryTitle: {
    color: "#29392D",
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 22,
  },
  emptySummaryText: {
    marginTop: 5,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
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
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E9E2",
    backgroundColor: palette.white,
  },
  eligibilityIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF7F1",
  },
  eligibilityCopy: { minWidth: 0, flex: 1, marginHorizontal: 10 },
  eligibilityTitle: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 12,
    lineHeight: 17,
  },
  eligibilityMessage: {
    marginTop: 3,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  smallAction: {
    width: "100%",
    minHeight: 44,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.ink,
  },
  smallActionText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 10,
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
  purchaseForm: {
    marginTop: 30,
    paddingBottom: 10,
  },
  writeReviewButton: {
    marginTop: 20, minHeight: 48, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: "#DDE3D6", borderRadius: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 9, backgroundColor: "#F8FAF5",
  },
  writeReviewText: { color: "#294331", fontFamily: typography.semibold, fontSize: 12 },
  purchaseEyebrow: {
    color: "#79816F", fontFamily: typography.medium,
    fontSize: 8, lineHeight: 14, letterSpacing: 2,
  },
  purchaseTitle: {
    marginTop: 10, color: "#202D24", fontFamily: typography.medium,
    fontSize: 28, lineHeight: 36, letterSpacing: -1,
  },
  purchaseIntro: {
    marginTop: 12, color: "#767A72", fontFamily: typography.regular,
    fontSize: 12, lineHeight: 21, maxWidth: 360,
  },
  contactTabs: {
    marginTop: 24, gap: 24, flexDirection: "row",
    borderBottomWidth: 1, borderBottomColor: "#E6E8E1",
  },
  contactTab: {
    flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 8,
    paddingVertical: 10, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
    borderBottomWidth: 2, borderBottomColor: "transparent", marginBottom: -1,
  },
  contactTabSelected: {
    borderBottomColor: "#294331",
  },
  contactTabText: { color: "#76806F", fontFamily: typography.medium, fontSize: 12 },
  contactTabTextSelected: { color: "#28432F", fontFamily: typography.semibold },
  purchaseLabel: {
    marginTop: 22, color: "#3E4B3E", fontFamily: typography.medium,
    fontSize: 11, lineHeight: 17,
  },
  purchaseInput: {
    height: 52, marginTop: 9, borderRadius: 6,
    borderColor: "#E0E3DB", backgroundColor: "#FAFBF8",
    fontFamily: typography.regular, fontSize: 13,
  },
  purchasePrivacy: { marginTop: 18, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  purchasePrivacyText: {
    flex: 1, color: "#77806F", fontFamily: typography.regular,
    fontSize: 10, lineHeight: 16,
  },
  purchaseSubmit: {
    minHeight: 52, marginTop: 24, paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 6, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 9, backgroundColor: "#213B2B",
  },
  purchaseSubmitDisabled: { opacity: 0.55 },
  purchaseSubmitText: { color: "#FFFFFF", fontFamily: typography.semibold, fontSize: 12 },
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
  // ── Horizontal review carousel ──
  reviewScroller: {
    marginTop: 22,
    marginHorizontal: -20, // bleed out of section padding
  },
  reviewCarousel: {
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: CARD_GAP,
    paddingRight: 32,
  },
  reviewCard: {
    padding: 0,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: "#EAECE9",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  // ── Top Header Row ──
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 4,
    flexWrap: "wrap",
    gap: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewRatingValue: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 12,
  },
  verifiedBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedBadgeText: {
    color: "#15803D",
    fontFamily: typography.bold,
    fontSize: 10,
  },

  // ── Review content ──
  reviewTitle: {
    marginTop: 10,
    paddingHorizontal: 18,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 16,
    lineHeight: 20,
  },
  reviewBody: {
    marginTop: 8,
    paddingHorizontal: 18,
    color: "#334155",
    fontFamily: typography.regular,
    fontSize: 13.5,
    lineHeight: 21,
  },
  arabicBodyBox: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
    color: "#0F172A",
    fontFamily: typography.bold,
    fontSize: 14.5,
    lineHeight: 24,
  },

  // ── Footer (author) ──
  reviewFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F2EF",
  },
  avatarText: {
    color: "#384438",
    fontFamily: typography.black,
    fontSize: 13,
  },
  footerCopy: { minWidth: 0, flex: 1, marginLeft: 10 },
  authorName: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewDate: {
    marginTop: 2,
    color: "#64748B",
    fontFamily: typography.medium,
    fontSize: 10.5,
    lineHeight: 14,
  },
  verifiedPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
  },

  // ── Review images ──
  imageScroller: { marginTop: 12, marginHorizontal: 20 },
  imageRow: { gap: 8 },
  reviewImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: palette.canvas,
  },
  lightboxOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  lightboxImage: {
    width: "90%",
    height: "70%",
  },
  lightboxClose: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // ── Admin reply ──
  reply: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#EDF0EB",
    backgroundColor: "#FAFBF9",
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  replyIcon: { width: 28, height: 28, borderRadius: 7 },
  replyCaption: { marginLeft: "auto", color: "#737970", fontFamily: typography.medium, fontSize: 10, flexShrink: 1 },
  replyLabel: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  replyText: {
    color: "#5A5F59",
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 21,
  },
  replyToggle: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, alignSelf: "flex-start" },
  replyToggleText: { fontFamily: typography.bold, fontSize: 12, color: palette.greenDark },
});
