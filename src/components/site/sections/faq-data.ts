/* SSS verileri — hem faq.tsx (görünüm) hem page.tsx (FAQPage JSON-LD) kullanır.
   "use client" dosyasında tutulursa server tarafında değeri okunamaz. */

export const FAQS = [
  {
    question: "Veliler robot olduğunu anlar mı, aramalara tepki gösterir mi?",
    answer:
      "Kesinlikle hayır. educallai, 650 milisaniyenin altında insan tepki süresine sahip, yerel Türkçe diksiyon, nefes duraklamaları ve eğitim terminolojisini harmanlayan gelişmiş ses modelleri kullanır. Aramalarda velilerin %96'sı kurumun gerçek rehber danışmanıyla konuştuğunu düşünmektedir.",
  },
  {
    question: "Mevcut öğrenci ve veli kayıtlarımızı aktarmak zor mu?",
    answer:
      "Hayır. K12NET, Özel Okul Portalı veya Excel formatındaki tüm öğrenci listelerinizi aynı gün içinde sisteme aktarırız. Numara biçim hataları otomatik düzeltilir ve aktarım doğrulaması size raporlanır.",
  },
  {
    question: "KVKK ve İYS (İleti Yönetim Sistemi) açısından yasal risk var mı?",
    answer:
      "educallai tamamen yürürlükteki MEB ve Ticaret Bakanlığı mevzuatına uyumludur. İleti Yönetim Sistemi (İYS) izinli listeleriyle çift yönlü konuşur. Veli görüşme sırasında 'bir daha aranmak istemiyorum' dediğinde asistan durumu anında algılayarak numarayı kalıcı ret listesine alır.",
  },
  {
    question: "Geciken taksit tahsilatında veliyle tatsızlık veya polemik yaşanır mı?",
    answer:
      "Hayır. Asistanımız eğitim kurumu nezaketine uygun, son derece saygılı ve kurumunuzun belirlediği tolerans sınırları içinde kalır. Asla ısrarcı veya kaba ifadeler kullanmaz; veliyi dinler, uygunsa ödeme linkini WhatsApp'tan iletir veya kurum muhasebesine randevu notu düşer.",
  },
  {
    question: "Asistan yanlış veya uydurma bilgi verirse ne olur?",
    answer:
      "Asistan yalnızca sizin onayladığınız bilgi bankası ve senaryolarla konuşur; alanının dışındaki sorularda tahmin yürütmez, konuyu özetiyle birlikte danışmanınıza devreder. Her görüşmenin transkripti panelde durur — istediğiniz an denetlersiniz.",
  },
  {
    question: "Kurulum gerçekten ne kadar sürer?",
    answer:
      "WhatsApp'tan kurum adınızı ve tahmini öğrenci sayınızı yazmanız yeterli. Senaryoyu aynı gün hazırlar, öğrenci listenizi (Excel veya K12NET) sisteme aktarır ve 1 gün içinde ilk aramaları yapar hale geliriz. Teknik bilgi gerekmez.",
  },
  {
    question: "WhatsApp numaramız engellenir (ban) mi?",
    answer:
      "Hayır. educallai resmi Meta WhatsApp Business Cloud API üzerinden çalışır; tüm mesajlar onaylı şablonlarla, velinin izin verdiği hızda gönderilir. Bu kanal, kişisel WhatsApp'tan toplu mesaj atmanın aksine ban riski taşımaz.",
  },
  {
    question: "Öğrenci ve veli verilerimiz güvende mi?",
    answer:
      "Evet. Veriler Türkiye merkezli sunucularda tutulur, üçüncü taraflarla paylaşılmaz ve KVKK süreçleri sistemin içinde tanımlıdır. Asistan veli 'bir daha beni aramayın' dediğinde numarayı kalıcı ret listesine alır.",
  },
] as const;
