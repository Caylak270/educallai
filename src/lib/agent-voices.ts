/**
 * Sesli ajanın canlı ses kataloğu — agent/agent-settings.json'a yazılır.
 * engine "natural" = Cartesia cascade (insan gibi TR sesi, ~1,4 sn),
 * engine "hybrid"  = OpenAI Realtime beyin + Cartesia ses (~0,6-0,8 sn),
 * engine "fast"    = OpenAI Realtime (en hızlı, ~0,4 sn).
 */

export type AgentEngine = "natural" | "hybrid" | "fast";

export interface AgentVoiceOption {
  id: string;
  engine: AgentEngine;
  name: string;
  description: string;
  /** natural/hybrid modda Cartesia ses cinsiyeti */
  cartVoice: "female" | "male" | null;
  /** fast modda OpenAI Realtime ses adı */
  realtimeVoice: string | null;
  tag: string;
}

export const AGENT_VOICES: AgentVoiceOption[] = [
  {
    id: "hybrid-female",
    engine: "hybrid",
    name: "VeliPilot Kadın (Hibrit)",
    description: "Doğal TR kadın sesi + hızlı zekâ (~0,6-0,8 sn) — önerilen",
    cartVoice: "female",
    realtimeVoice: null,
    tag: "Hibrit",
  },
  {
    id: "hybrid-male",
    engine: "hybrid",
    name: "VeliPilot Erkek (Hibrit)",
    description: "Sakin TR erkek sesi + hızlı zekâ (~0,6-0,8 sn)",
    cartVoice: "male",
    realtimeVoice: null,
    tag: "Hibrit",
  },
  {
    id: "cartesia-female",
    engine: "natural",
    name: "VeliPilot Kadın",
    description: "İnsan gibi sıcak Türkçe kadın sesi (Cartesia)",
    cartVoice: "female",
    realtimeVoice: null,
    tag: "Doğal",
  },
  {
    id: "cartesia-male",
    engine: "natural",
    name: "VeliPilot Erkek",
    description: "Sakin, güven veren Türkçe erkek sesi (Cartesia)",
    cartVoice: "male",
    realtimeVoice: null,
    tag: "Doğal",
  },
  {
    id: "realtime-marin",
    engine: "fast",
    name: "Marin",
    description: "En hızlı yanıt (~0,4 sn) · OpenAI sesi",
    cartVoice: null,
    realtimeVoice: "marin",
    tag: "Hızlı",
  },
  {
    id: "realtime-verse",
    engine: "fast",
    name: "Verse",
    description: "Hızlı yanıt, dengeli ton · OpenAI sesi",
    cartVoice: null,
    realtimeVoice: "verse",
    tag: "Hızlı",
  },
  {
    id: "realtime-coral",
    engine: "fast",
    name: "Coral",
    description: "Hızlı yanıt, sıcak ton · OpenAI sesi",
    cartVoice: null,
    realtimeVoice: "coral",
    tag: "Hızlı",
  },
];

export function findAgentVoice(id: string): AgentVoiceOption {
  return AGENT_VOICES.find((v) => v.id === id) ?? AGENT_VOICES[0];
}
