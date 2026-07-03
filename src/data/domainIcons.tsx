import {
  Scale,
  Compass,
  ScrollText,
  BookOpen,
  Gem,
  Mic,
  Gavel,
  Languages,
  GraduationCap,
  Monitor,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import type { DomainId } from "./domains";

/**
 * DomainId -> lucide-react ikon eşlemesi. `domains.ts` saf veri dosyası
 * olarak kalsın diye ikon bileşenleri burada tutulur.
 */
export const DOMAIN_ICONS: Record<DomainId, LucideIcon> = {
  fiqh: Scale,
  usul: Compass,
  hadith: ScrollText,
  "quran-tafsir": BookOpen,
  aqida: Gem,
  "dawah-sira": Mic,
  "law-politics": Gavel,
  "language-skills": Languages,
  "university-culture": GraduationCap,
  digital: Monitor,
  training: Briefcase,
};
