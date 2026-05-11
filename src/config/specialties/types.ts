export type EncounterFieldKind = "text" | "textarea" | "number" | "date" | "select";

export type EncounterSection = {
  id: string;
  labelAr: string;
  labelEn: string;
  kind: EncounterFieldKind;
  placeholderAr?: string;
  options?: string[];
  required?: boolean;
};

export type DocumentType = {
  id: string;
  labelAr: string;
  labelEn: string;
};

export type DashboardWidget = {
  id: string;
  labelAr: string;
  labelEn: string;
};

export type SpecialtyConfig = {
  code: string;
  nameAr: string;
  nameEn: string;
  encounterSections: EncounterSection[];
  documentTypes: DocumentType[];
  quickDiagnoses: string[];
  favoriteMedications: string[];
  dashboardWidgets: DashboardWidget[];
};
