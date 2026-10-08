import type { OrderStatus } from "./order";
import type { Flag } from "./result";

export type LabItemView = {
  id: string;
  testId: string | null;
  name: string;
  unit: string | null;
  price: number;
  refLowM: number | null;
  refHighM: number | null;
  refLowF: number | null;
  refHighF: number | null;
  critLow: number | null;
  critHigh: number | null;
  result: number | null;
  flag: Flag | null;
};

export type LabOrderView = {
  id: string;
  number: number;
  patientName: string;
  patientPhone: string | null;
  sex: "m" | "f";
  age: number | null;
  doctorName: string | null;
  urgent: boolean;
  status: OrderStatus;
  total: number;
  paid: boolean;
  notes: string | null;
  publicToken: string;
  sentAt: string | null;
  createdAt: string;
  items: LabItemView[];
};

export type LabTestView = {
  id: string;
  name: string;
  nameEn: string | null;
  category: string;
  unit: string | null;
  price: number;
  refLowM: number | null;
  refHighM: number | null;
  refLowF: number | null;
  refHighF: number | null;
  critLow: number | null;
  critHigh: number | null;
  imageUrl?: string | null;
};

type DbItem = Omit<LabItemView, "flag"> & { flag: string | null };
type DbOrder = Omit<LabOrderView, "createdAt" | "sentAt" | "items" | "status" | "sex"> & {
  createdAt: Date;
  sentAt: Date | null;
  status: string;
  sex: string;
  items: DbItem[];
};

/** Converts database rows into plain objects that can cross to client components. */
export function toOrderView(order: DbOrder): LabOrderView {
  return {
    id: order.id,
    number: order.number,
    patientName: order.patientName,
    patientPhone: order.patientPhone,
    sex: order.sex === "f" ? "f" : "m",
    age: order.age,
    doctorName: order.doctorName,
    urgent: order.urgent,
    status: order.status as OrderStatus,
    total: order.total,
    paid: order.paid,
    notes: order.notes,
    publicToken: order.publicToken,
    sentAt: order.sentAt ? order.sentAt.toISOString() : null,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      testId: item.testId,
      name: item.name,
      unit: item.unit,
      price: item.price,
      refLowM: item.refLowM,
      refHighM: item.refHighM,
      refLowF: item.refLowF,
      refHighF: item.refHighF,
      critLow: item.critLow,
      critHigh: item.critHigh,
      result: item.result,
      flag: item.flag as Flag | null,
    })),
  };
}
