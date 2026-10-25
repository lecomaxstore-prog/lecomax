export type ComputerRegion = { id: string; box: [number, number, number, number] };
// Percentages in the original 1024 × 1536 generated images. Hidden chips have no hit target.
export const computerRegions: Record<'desktop' | 'laptop', ComputerRegion[]> = {
  desktop: [
    { id: 'case', box: [2, 6, 97, 85] }, { id: 'motherboard', box: [11, 14, 59, 50] },
    { id: 'cooler', box: [26, 14, 25, 24] }, { id: 'ram', box: [53, 15, 9, 25] },
    { id: 'ssd', box: [27, 39, 21, 4] }, { id: 'gpu', box: [8, 44, 67, 10] },
    { id: 'psu', box: [6, 65, 40, 20] }, { id: 'hdd', box: [59, 72, 27, 10] },
    { id: 'fans', box: [81, 14, 8, 26] }, { id: 'fans', box: [82, 42, 7, 22] },
    { id: 'ports', box: [11, 14, 8, 25] }, { id: 'cables', box: [66, 24, 14, 10] },
    { id: 'cables', box: [69, 47, 11, 15] }, { id: 'vrm', box: [19, 16, 7, 20] },
  ],
  laptop: [
    { id: 'case', box: [1, 22, 98, 52] }, { id: 'motherboard', box: [8, 24, 83, 30] },
    { id: 'cooler', box: [29, 23, 41, 14] }, { id: 'fans', box: [7, 27, 24, 15] },
    { id: 'fans', box: [70, 27, 22, 15] }, { id: 'ram', box: [48, 38, 23, 14] },
    { id: 'ssd', box: [21, 45, 25, 7] }, { id: 'wifi', box: [8, 43, 11, 9] },
    { id: 'battery', box: [9, 55, 82, 17] }, { id: 'speakers', box: [2, 57, 6, 15] },
    { id: 'speakers', box: [92, 57, 6, 15] }, { id: 'cables', box: [53, 52, 8, 4] },
    { id: 'cables', box: [25, 52, 8, 4] }, { id: 'ports', box: [1, 27, 4, 26] },
    { id: 'ports', box: [95, 28, 4, 25] },
  ],
};
