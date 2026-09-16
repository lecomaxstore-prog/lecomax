export type SeedReview = {
  id: string;
  author_name: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  color: string | null;
  created_at: string;
};

// No synthetic customer reviews. Empty products remain unrated.
const SEED_REVIEWS: Record<string, SeedReview[]> = {};
export default SEED_REVIEWS;
