/**
 * Design System for Clinic Management SaaS
 * Follows CRM UI Kit for SaaS Dashboards
 * Preserves all section names and labels
 */

// Premium SaaS Color Palette
export const COLORS = {
  // Primary
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c3d66',
  },
  // Secondary - Navy
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Success
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#145231',
  },
  // Warning
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // Danger
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // Info
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
};

// Status Colors (Clinical)
export const STATUS_COLORS = {
  active: 'emerald',
  inactive: 'rose',
  trial: 'amber',
  pending: 'amber',
  confirmed: 'blue',
  completed: 'emerald',
  cancelled: 'red',
} as const;

// Arabic Labels (Preserved)
export const LABELS = {
  // Common
  search: 'بحث',
  save: 'حفظ',
  cancel: 'إلغاء',
  delete: 'حذف',
  edit: 'تعديل',
  add: 'إضافة',
  back: 'رجوع',
  loading: 'جاري التحميل...',
  error: 'حدث خطأ',
  success: 'تم بنجاح',
  noResults: 'لا توجد نتائج',

  // Super Admin
  adminClinics: 'إدارة العيادات',
  clinicsOperations: 'Clinics Operations',
  totalClinics: 'إجمالي العيادات',
  activeClinics: 'العيادات النشطة',
  expiringClinics: 'تنتهي قريباً',
  needsReview: 'تحتاج متابعة',
  allClinics: 'الكل',
  activeClinicsTab: 'نشطة',
  trialClinicsTab: 'تجريبية',
  inactiveClinicsTab: 'متوقفة',
  expiringTab: 'تنتهي قريباً',
  dangerZone: 'منطقة الخطر',
  enter: 'دخول',
  deactivate: 'إيقاف',
  activate: 'تفعيل',
  deleteAllClinics: 'حذف كل العيادات',

  // Clinic Dashboard
  clinicDentistry: 'تشغيل عيادة الأسنان',
  clinicPediatrics: 'تشغيل عيادة الأطفال',
  clinicDermatology: 'تشغيل عيادة الجلدية',
  clinicCardiology: 'تشغيل عيادة القلب',
  clinicGynecology: 'تشغيل عيادة النسائية',
  
  appointmentsToday: 'حجوزات اليوم',
  waitingList: 'قائمة الانتظار',
  completedVisits: 'زيارات منتهية',
  
  openPatientFiles: 'فتح ملفات المراجعين',
  treatmentReport: 'تقرير علاج',
  waitingScreen: 'شاشة الانتظار',

  // Appointments
  appointmentsCalendar: 'تقويم المواعيد',
  today: 'اليوم',
  week: 'الأسبوع',
  upcoming: 'القادمة',
  past: 'السابقة',
  all: 'الكل',
  
  allStatuses: 'كل الحالات',
  pending: 'معلق',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',

  // Patients
  patientsList: 'سجل المراجعين',
  searchByName: 'ابحث بالاسم أو رقم الهاتف',
  upcomingAppointment: 'موعد قادم',
  visits: 'زيارة',
  lastVisit: 'آخر زيارة',
  patientProfile: 'ملف المريض',

  // Plans
  planTrial: 'تجريبي',
  planBasic: 'أساسية',
  planStandard: 'متوسطة',
  planPremium: 'مميزة',

  // Status
  statusActive: 'فعال',
  statusInactive: 'متوقف',
  statusTrial: 'تجريبي',

  // Fields
  clinic: 'العيادة',
  phone: 'الهاتف',
  whatsapp: 'رقم الواتساب',
  plan: 'الخطة',
  status: 'الحالة',
  expiresAt: 'انتهاء الاشتراك',
  actions: 'الإجراءات',
  clinicName: 'اسم العيادة',
  patientName: 'اسم المريض',
};

// Typography
export const TYPOGRAPHY = {
  h1: 'text-4xl font-black tracking-tight',
  h2: 'text-3xl font-black tracking-tight',
  h3: 'text-2xl font-black tracking-tight',
  h4: 'text-xl font-black tracking-tight',
  h5: 'text-lg font-bold',
  h6: 'text-base font-bold',
  body: 'text-sm font-semibold',
  small: 'text-xs font-semibold',
  caption: 'text-xs font-bold',
};

// Spacing
export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
  '3xl': '3rem',
};

// Border Radius
export const RADIUS = {
  none: '0px',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

// Shadows
export const SHADOWS = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
  premium: '0 18px 70px rgba(15, 23, 42, 0.07)',
};
