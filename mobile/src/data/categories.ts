export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | number;
};

export const categories: HomeCategory[] = [
  { id: "electronics", name: "Electronics", slug: "electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=85" },
  { id: "shoes", name: "Shoes", slug: "shoes", image: require("../../assets/images/categories/shoes.png") },
  { id: "clothing", name: "Clothing", slug: "clothing", image: require("../../assets/images/categories/clothes.png") },
  { id: "accessories", name: "Accessories", slug: "accessories", image: require("../../assets/images/categories/accessoires.png") },
  { id: "perfumes", name: "Perfumes", slug: "perfumes", image: require("../../assets/images/categories/Perfume.png") },
  { id: "new", name: "New Arrivals", slug: "new", image: require("../../assets/images/categories/New Arrivals.png") },
];
