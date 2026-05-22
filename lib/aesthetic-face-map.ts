export type AestheticFaceZone = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect"; x: number; y: number; w: number; h: number; rx?: number }
);

export const AESTHETIC_FACE_MARKERS = [
  { key: "botox", labelAr: "بوتوكس", color: "#2563eb" },
  { key: "filler", labelAr: "فيلر", color: "#7c3aed" },
  { key: "prp", labelAr: "PRP / ميزوثيرابي", color: "#059669" },
  { key: "laser", labelAr: "ليزر", color: "#dc2626" },
  { key: "threads", labelAr: "خيوط شد", color: "#0891b2" },
  { key: "peel", labelAr: "تقشير", color: "#d97706" },
  { key: "fat", labelAr: "إذابة دهون", color: "#ea580c" },
  { key: "other", labelAr: "أخرى", color: "#6b7280" },
] as const;

// face-map.jpg is 600x800. Coordinates are aligned to the actual facial
// landmarks in the photo, not generic body-map positions.
export const AESTHETIC_FACE_ZONES: AestheticFaceZone[] = [
  { id: "forehead", labelAr: "الجبهة", shape: "rect", x: 205, y: 195, w: 190, h: 78, rx: 18 },
  { id: "glabella", labelAr: "بين الحاجبين", shape: "ellipse", cx: 300, cy: 316, rx: 34, ry: 20 },
  { id: "r_crow", labelAr: "حول العين اليمنى", shape: "ellipse", cx: 194, cy: 352, rx: 52, ry: 30 },
  { id: "l_crow", labelAr: "حول العين اليسرى", shape: "ellipse", cx: 406, cy: 352, rx: 52, ry: 30 },
  { id: "r_under_eye", labelAr: "تحت العين اليمنى", shape: "ellipse", cx: 220, cy: 394, rx: 50, ry: 18 },
  { id: "l_under_eye", labelAr: "تحت العين اليسرى", shape: "ellipse", cx: 380, cy: 394, rx: 50, ry: 18 },
  { id: "r_cheek", labelAr: "الخد الأيمن", shape: "ellipse", cx: 210, cy: 470, rx: 55, ry: 58 },
  { id: "l_cheek", labelAr: "الخد الأيسر", shape: "ellipse", cx: 390, cy: 470, rx: 55, ry: 58 },
  { id: "nose", labelAr: "الأنف", shape: "ellipse", cx: 300, cy: 444, rx: 36, ry: 56 },
  { id: "r_nasolabial", labelAr: "الطية الأنفية الشفوية اليمنى", shape: "ellipse", cx: 246, cy: 508, rx: 22, ry: 44 },
  { id: "l_nasolabial", labelAr: "الطية الأنفية الشفوية اليسرى", shape: "ellipse", cx: 354, cy: 508, rx: 22, ry: 44 },
  { id: "upper_lip", labelAr: "الشفة العليا", shape: "ellipse", cx: 300, cy: 528, rx: 62, ry: 12 },
  { id: "lower_lip", labelAr: "الشفة السفلى", shape: "ellipse", cx: 300, cy: 548, rx: 60, ry: 15 },
  { id: "r_marionette", labelAr: "خط الماريونيت الأيمن", shape: "ellipse", cx: 240, cy: 580, rx: 22, ry: 34 },
  { id: "l_marionette", labelAr: "خط الماريونيت الأيسر", shape: "ellipse", cx: 360, cy: 580, rx: 22, ry: 34 },
  { id: "chin", labelAr: "الذقن", shape: "ellipse", cx: 300, cy: 620, rx: 58, ry: 34 },
  { id: "r_jaw", labelAr: "زاوية الفك اليمنى", shape: "ellipse", cx: 185, cy: 575, rx: 42, ry: 56 },
  { id: "l_jaw", labelAr: "زاوية الفك اليسرى", shape: "ellipse", cx: 415, cy: 575, rx: 42, ry: 56 },
  { id: "neck", labelAr: "الرقبة", shape: "rect", x: 220, y: 670, w: 160, h: 72, rx: 18 },
];
