import { FloatWhatsApp } from "@/components/site/float-whatsapp";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

import "./site.css";

/*
  Pazarlama web sitesi iskeleti — dashboard'dan tamamen ayrı route grubu.
  Stitch export'undaki body sınıfları burada sarmalayıcıya taşındı (body
  root layout'a ait olduğundan dashboard'ı etkilememesi için).
*/
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased selection:bg-primary selection:text-on-primary">
      <SiteHeader />
      <main className="min-h-[calc(100vh-80px)] w-full pt-20">{children}</main>
      <SiteFooter />
      <FloatWhatsApp />
    </div>
  );
}
