import { Reveal } from "@/components/site/reveal";

export function Founder() {
  return (
    <section className="bg-surface-container-low py-space-2xl">
      <div className="mx-auto max-w-[860px] px-margin-mobile lg:px-margin">
        <Reveal className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm sm:p-10">
          <span className="font-label-sm font-bold text-label-sm uppercase tracking-wider text-primary">
            Neden Bu İş
          </span>
          <p className="mt-4 font-body-lg text-body-lg leading-relaxed text-on-surface">
            &quot;Erken kayıt döneminde kurumların telefon başında geçirdiği o haftaları
            hep gördük: aynı sorular, aynı broşürler, aynı &apos;bir daha arar
            mısınız&apos;lar. educallai&apos;ı kurduk çünkü veliye değer veren kurumun
            en değerli zamanının telefon değil, veliyle birebir geçen dakikalar
            olduğuna inanıyoruz. Tekrar eden her konuşmayı yapay zekaya, insan teması
            gerektiren her anı ekibinize bırakın.&quot;
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
              M
            </div>
            <div>
              <p className="font-title-md text-title-md text-on-surface">
                Mustafa
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                educallai kurucusu
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
