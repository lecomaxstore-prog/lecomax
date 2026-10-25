export type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
  level: 1 | 2;
};
export type Topic = {
  id: string;
  title: string;
  category: 'Earth' | 'Space' | 'Nature' | 'Science' | 'History';
  intro: string;
  sections: { title: string; text: string }[];
  questions: Question[];
  sources: string[];
  diagram?: 'layers' | 'seasons' | 'plates';
  color?: string;
};
export type Country = {
  id: string;
  name: string;
  fr: string;
  ar: string;
  iso: string;
  region: string;
  continent: string;
  population: number;
  year: number;
  lon: number;
  lat: number;
  polygons: number[][][][];
};
export type Planet = {
  id: string;
  diameter: number;
  gravity: number;
  temperature: number;
  distance: number;
  rotation: number;
  orbit: number;
  atmosphere: string;
  color: string;
};
