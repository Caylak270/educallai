/** M3 — 21. Yüzyıl Beceri Karnesi: beceri tanımları. */

import type { SkillId } from "@/lib/types/db";

export interface SkillDef {
  id: SkillId;
  label: string;
  icon: string;
  description: string;
}

export const SKILLS: SkillDef[] = [
  {
    id: "critical_thinking",
    label: "Eleştirel Düşünme",
    icon: "psychology",
    description: "Sorgulama, analiz, farklı çözüm yolları görme",
  },
  {
    id: "communication",
    label: "İletişim",
    icon: "forum",
    description: "Kendini sözlü/yazılı ifade, sunum becerisi",
  },
  {
    id: "collaboration",
    label: "İşbirliği",
    icon: "groups",
    description: "Grup çalışması, paylaşım, liderlik",
  },
  {
    id: "self_management",
    label: "Öz Yönetim",
    icon: "self_improvement",
    description: "Planlı çalışma, zaman yönetimi, motivasyon",
  },
  {
    id: "digital_literacy",
    label: "Dijital Okuryazarlık",
    icon: "devices",
    description: "Dijital kaynak kullanımı, online sınav pratiği",
  },
];

export const SCORE_LABEL: Record<number, string> = {
  1: "Gelişmeli",
  2: "Destek Gerekli",
  3: "Yeterli",
  4: "İyi",
  5: "Çok İyi",
};
