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

// #region agent log
void fetch('http://127.0.0.1:7352/ingest/3c34793a-6080-4c09-b4f5-c17bc4dbf25b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e3b22a'},body:JSON.stringify({sessionId:'e3b22a',runId:'initial',hypothesisId:'H1,H3',location:'src/data/domainIcons.tsx:35',message:'domain icon module loaded',data:{iconKeys:Object.keys(DOMAIN_ICONS),missingIconKeys:Object.entries(DOMAIN_ICONS).filter(([,Icon])=>!Icon).map(([key])=>key),iconTypes:Object.fromEntries(Object.entries(DOMAIN_ICONS).map(([key,Icon])=>[key,typeof Icon]))},timestamp:Date.now()})}).catch(()=>{});
// #endregion
