/**
 * Sesli ajanın canlı ses kataloğu — agent/agent-settings.json'a yazılır.
 * engine "natural" = Cartesia cascade (insan gibi TR sesi, ~1,4 sn),
 * engine "fast"    = OpenAI Realtime (en hızlı, ~0,4 sn).
 */

export type AgentEngine = "natural" | "fast";

export interface AgentVoiceOption {
  id: string;
  engine: AgentEngine;
  name: string;
  description: string;
  /** natural modda Cartesia ses cinsiyeti */
  cartVoice: "female" | "male" | null;
  /** fast modda OpenAI Realtime ses adı */
  realtimeVoice: string | null;
  tag: string;
}

export const AGENT_VOICES: AgentVoiceOption[] = [
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
