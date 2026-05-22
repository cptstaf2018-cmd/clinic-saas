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

export const AESTHETIC_FACE_IMAGE = {
  src: "/face-map.png",
  width: 490,
  height: 477,
} as const;

// face-map.png is 490x477. Coordinates are aligned to the labeled cosmetic
// landmarks in the image.
export const AESTHETIC_FACE_ZONES: AestheticFaceZone[] = [
  { id: "forehead", labelAr: "منطقة الجبهة", shape: "ellipse", cx: 235, cy: 138, rx: 45, ry: 24 },
  { id: "brow_lift", labelAr: "رفع الحاجب", shape: "ellipse", cx: 316, cy: 156, rx: 42, ry: 22 },
  { id: "glabella", labelAr: "بين الحاجبين", shape: "ellipse", cx: 241, cy: 184, rx: 34, ry: 18 },
  { id: "r_crow", labelAr: "حول العين اليمنى", shape: "ellipse", cx: 190, cy: 194, rx: 24, ry: 18 },
  { id: "l_crow", labelAr: "حول العين اليسرى", shape: "ellipse", cx: 292, cy: 194, rx: 24, ry: 18 },
  { id: "r_under_eye", labelAr: "تحت العين اليمنى", shape: "ellipse", cx: 188, cy: 218, rx: 42, ry: 16 },
  { id: "l_under_eye", labelAr: "تحت العين اليسرى", shape: "ellipse", cx: 294, cy: 218, rx: 42, ry: 16 },
  { id: "r_cheek", labelAr: "الخد الأيمن", shape: "ellipse", cx: 174, cy: 268, rx: 45, ry: 42 },
  { id: "l_cheek", labelAr: "الخد الأيسر", shape: "ellipse", cx: 308, cy: 268, rx: 45, ry: 42 },
  { id: "nose", labelAr: "الأنف", shape: "ellipse", cx: 241, cy: 260, rx: 28, ry: 42 },
  { id: "r_nasolabial", labelAr: "خطوط الابتسامة اليمنى", shape: "ellipse", cx: 202, cy: 287, rx: 20, ry: 34 },
  { id: "l_nasolabial", labelAr: "خطوط الابتسامة اليسرى", shape: "ellipse", cx: 280, cy: 287, rx: 20, ry: 34 },
  { id: "upper_lip", labelAr: "الشفة العليا", shape: "ellipse", cx: 241, cy: 296, rx: 42, ry: 8 },
  { id: "lower_lip", labelAr: "الشفة السفلى", shape: "ellipse", cx: 241, cy: 310, rx: 42, ry: 10 },
  { id: "r_marionette", labelAr: "خط الماريونيت الأيمن", shape: "ellipse", cx: 206, cy: 324, rx: 18, ry: 28 },
  { id: "l_marionette", labelAr: "خط الماريونيت الأيسر", shape: "ellipse", cx: 276, cy: 324, rx: 18, ry: 28 },
  { id: "chin", labelAr: "الذقن", shape: "ellipse", cx: 241, cy: 340, rx: 46, ry: 28 },
  { id: "r_jaw", labelAr: "زاوية الفك اليمنى", shape: "ellipse", cx: 178, cy: 330, rx: 34, ry: 42 },
  { id: "l_jaw", labelAr: "زاوية الفك اليسرى", shape: "ellipse", cx: 304, cy: 330, rx: 34, ry: 42 },
  { id: "neck", labelAr: "منطقة الرقبة", shape: "ellipse", cx: 195, cy: 344, rx: 38, ry: 26 },
];
