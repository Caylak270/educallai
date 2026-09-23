import { redirect } from "next/navigation";

// Yönetim paneli ayrı depoya (dershane-ai-hub) taşındı; kök adres
// pazarlama sitesine yönlendirir.
export default function RootPage() {
  redirect("/web");
}
