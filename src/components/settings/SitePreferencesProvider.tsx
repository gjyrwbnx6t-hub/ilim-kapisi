"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { careerCopy } from "@/lib/career-copy";

export type SiteLanguage = "tr" | "ar";
export type SiteTheme = "light" | "dark";

const LANGUAGE_STORAGE_KEY = "ilim-kapisi-language";
const THEME_STORAGE_KEY = "ilim-kapisi-theme";

const siteCopy = {
  tr: {
    direction: "ltr",
    nav: {
      home: "Ana Sayfa",
      fiqh: "Fıkıh Usûlü",
      din: "Din Usûlü",
      rearapca: "Rearapça",
      career: "Kariyer",
      routine: "Rutin",
      panel: "Panel",
      profile: "Profilim",
      settings: "Ayarlar",
      signIn: "Giriş",
      signOut: "Çıkış",
      signOutConfirmTitle: "Çıkış yapılsın mı?",
      signOutConfirmDescription:
        "Hesabından çıkış yapmak istediğine emin misin?",
      signOutConfirmCancel: "Vazgeç",
      signOutConfirmAction: "Çıkış Yap",
      signOutConfirmPending: "Çıkış yapılıyor...",
    },
    settings: {
      title: "Ayarlar",
      subtitle:
        "Hesap, dil ve tema tercihlerini buradan yönetebilirsin.",
      languageTitle: "Site Dili",
      languageDescription:
        "Bu tercih yalnızca arayüz metinlerini değiştirir. Türkçe eğitim materyalleri ve ders içerikleri olduğu gibi kalır.",
      languageCurrent: "Geçerli dil",
      switchToArabic: "Arapçaya Geç",
      switchToTurkish: "Türkçeye Geç",
      turkish: "Türkçe",
      arabic: "العربية",
      themeTitle: "Tema",
      themeDescription:
        "Göz konforuna göre açık veya koyu görünümü kullan.",
      themeCurrent: "Geçerli tema",
      light: "Açık",
      dark: "Koyu",
      switchToLight: "Açık Temaya Geç",
      switchToDark: "Koyu Temaya Geç",
      accountTitle: "Hesap",
      accountDescription:
        "Şifreni değiştirebilir veya hesabından güvenli şekilde çıkış yapabilirsin.",
      signedInAs: "Oturum",
      passwordTitle: "Şifreyi Değiştir",
      passwordDescription: "Yeni şifren en az 6 karakter olmalı.",
      newPassword: "Yeni şifre",
      confirmPassword: "Yeni şifre tekrar",
      updatePassword: "Şifreyi Güncelle",
      updatingPassword: "Güncelleniyor...",
      signOut: "Hesaptan Çıkış Yap",
      accountUnavailable:
        "Hesap işlemleri için Supabase bağlantısı gerekiyor.",
      signInRequired:
        "Şifre değiştirmek ve çıkış yapmak için önce giriş yapmalısın.",
      signIn: "Giriş Yap",
    },
    career: careerCopy.tr,
  },
  ar: {
    direction: "rtl",
    nav: {
      home: "الرئيسية",
      fiqh: "أصول الفقه",
      din: "أصول الدين",
      rearapca: "Rearapça",
      career: "المسار الجامعي",
      routine: "الروتين",
      panel: "لوحة التحكم",
      profile: "ملفي",
      settings: "الإعدادات",
      signIn: "تسجيل الدخول",
      signOut: "خروج",
      signOutConfirmTitle: "تأكيد تسجيل الخروج",
      signOutConfirmDescription:
        "هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟",
      signOutConfirmCancel: "إلغاء",
      signOutConfirmAction: "تسجيل الخروج",
      signOutConfirmPending: "جار تسجيل الخروج...",
    },
    settings: {
      title: "الإعدادات",
      subtitle: "يمكنك إدارة الحساب واللغة والمظهر من هنا.",
      languageTitle: "لغة الموقع",
      languageDescription:
        "هذا الخيار يغيّر نصوص الواجهة فقط. تبقى المواد التعليمية التركية ومحتوى الدروس كما هي.",
      languageCurrent: "اللغة الحالية",
      switchToArabic: "التحويل إلى العربية",
      switchToTurkish: "التحويل إلى التركية",
      turkish: "Türkçe",
      arabic: "العربية",
      themeTitle: "المظهر",
      themeDescription: "اختر الوضع الفاتح أو الداكن بما يناسب راحتك.",
      themeCurrent: "المظهر الحالي",
      light: "فاتح",
      dark: "داكن",
      switchToLight: "التبديل إلى الفاتح",
      switchToDark: "التبديل إلى الداكن",
      accountTitle: "الحساب",
      accountDescription:
        "يمكنك تغيير كلمة المرور أو تسجيل الخروج بأمان.",
      signedInAs: "الجلسة",
      passwordTitle: "تغيير كلمة المرور",
      passwordDescription: "يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.",
      newPassword: "كلمة المرور الجديدة",
      confirmPassword: "تأكيد كلمة المرور الجديدة",
      updatePassword: "تحديث كلمة المرور",
      updatingPassword: "جار التحديث...",
      signOut: "تسجيل الخروج من الحساب",
      accountUnavailable:
        "تحتاج إجراءات الحساب إلى اتصال Supabase.",
      signInRequired:
        "يجب تسجيل الدخول أولا لتغيير كلمة المرور أو تسجيل الخروج.",
      signIn: "تسجيل الدخول",
    },
    career: careerCopy.ar,
  },
} as const;

type SiteCopy = (typeof siteCopy)[SiteLanguage];

interface SitePreferencesContextValue {
  copy: SiteCopy;
  direction: "ltr" | "rtl";
  language: SiteLanguage;
  setLanguage: (language: SiteLanguage) => void;
  theme: SiteTheme;
  toggleLanguage: () => void;
  toggleTheme: () => void;
}

const SitePreferencesContext =
  createContext<SitePreferencesContextValue | null>(null);

function readStoredLanguage(): SiteLanguage {
  if (typeof window === "undefined") return "tr";
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "ar" ? "ar" : "tr";
}

function readStoredTheme(): SiteTheme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
    ? "dark"
    : "light";
}

export default function SitePreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] = useState<SiteLanguage>("tr");
  const [theme, setTheme] = useState<SiteTheme>("light");
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);

  useEffect(() => {
    setLanguageState(readStoredLanguage());
    setTheme(readStoredTheme());
    setHasLoadedPreferences(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dataset.siteLanguage = language;
    if (hasLoadedPreferences) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }, [hasLoadedPreferences, language]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-dark", theme === "dark");
    root.style.colorScheme = theme;
    if (hasLoadedPreferences) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [hasLoadedPreferences, theme]);

  const setLanguage = useCallback((nextLanguage: SiteLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === "tr" ? "ar" : "tr"));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo<SitePreferencesContextValue>(
    () => ({
      copy: siteCopy[language],
      direction: siteCopy[language].direction,
      language,
      setLanguage,
      theme,
      toggleLanguage,
      toggleTheme,
    }),
    [language, setLanguage, theme, toggleLanguage, toggleTheme],
  );

  return (
    <SitePreferencesContext.Provider value={value}>
      {children}
    </SitePreferencesContext.Provider>
  );
}

export function useSitePreferences() {
  const context = useContext(SitePreferencesContext);
  if (!context) {
    throw new Error(
      "useSitePreferences must be used inside SitePreferencesProvider",
    );
  }
  return context;
}
