export type Banner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  href: string;
  accent: string;
};

export const banners: Banner[] = [
  {
    id: "future-ready",
    eyebrow: "HIGHLIGHT",
    title: "TECH THAT MOVES WITH YOU",
    description: "A sharper edit of everyday innovation.",
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=88",
    href: "/catalog?category=electronics",
    accent: "#B9F5D5",
  },
  {
    id: "street-icons",
    eyebrow: "JUST LANDED",
    title: "YOUR NEXT STEP STARTS HERE",
    description: "Fresh silhouettes. Effortless comfort.",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=88",
    href: "/catalog?category=shoes",
    accent: "#FFE1D3",
  },
  {
    id: "quiet-luxury",
    eyebrow: "THE EDIT",
    title: "DETAILS MAKE THE DIFFERENCE",
    description: "Premium essentials, selected by Lecomax.",
    image:
      "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1400&q=88",
    href: "/catalog?sort=new",
    accent: "#E8E1FF",
  },
];
