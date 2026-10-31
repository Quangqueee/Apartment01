import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { PublicPageShell } from "@/components/public-page-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/faq";
import { SITE, SITE_PATHS } from "@/lib/site";
import { buildFaqJsonLd } from "@/lib/structured-data";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Câu hỏi thường gặp",
  description:
    "Giải đáp về thuê căn hộ Hà Nội tại Hanoi Residences: khu vực cho thuê, giá, xem nhà, đặt cọc, thú cưng, phí dịch vụ và hỗ trợ khách nước ngoài.",
  alternates: {
    canonical: SITE_PATHS.faq,
    languages: {
      "vi-VN": SITE_PATHS.faq,
      "x-default": SITE_PATHS.faq,
    },
  },
  openGraph: {
    title: "Câu hỏi thường gặp | Hanoi Residences",
    description:
      "Giải đáp về thuê căn hộ Hà Nội tại Hanoi Residences: khu vực cho thuê, giá, xem nhà, đặt cọc, thú cưng, phí dịch vụ và hỗ trợ khách nước ngoài.",
    url: SITE_PATHS.faq,
    type: "website",
  },
};

export default function FaqPage() {
  return (
    <PublicPageShell>
      <JsonLd id="schema-faq" data={buildFaqJsonLd()} />
      <section className="container mx-auto max-w-3xl overflow-x-hidden px-4 py-10 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
          Hỗ trợ khách hàng
        </p>
        <h1 className="mt-2 font-headline text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Câu hỏi thường gặp
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Những câu hỏi khách thuê căn hộ tại Hà Nội hỏi nhiều nhất. Cần tư vấn
          thêm, liên hệ {SITE.founderName} qua {SITE.telephoneDisplay} hoặc{" "}
          <Link
            href={SITE.sameAs[0]}
            className="font-medium text-primary underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </Link>
          .
        </p>

        <Accordion type="multiple" className="mt-8 w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm leading-relaxed text-muted-foreground">
          Chủ nhà muốn đăng tin hoặc ủy thác quản lý? Xem{" "}
          <Link
            href={SITE_PATHS.partnerRegister}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            đăng ký đối tác
          </Link>
          . Chính sách dữ liệu tại{" "}
          <Link
            href={SITE_PATHS.privacy}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Chính sách bảo mật
          </Link>
          .
        </div>
      </section>
    </PublicPageShell>
  );
}
