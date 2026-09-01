"use client";

import Link from "next/link";
import { InfoCard } from "@/components/home/InfoCard";
import { SectionContainer } from "@/components/home/SectionContainer";
import { StructuredData } from "@/components/home/StructuredData";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useTranslation } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useTranslation();

  const services = [
    {
      titleKey: "home.service.1.title",
      points: [t("home.service.1.point.1"), t("home.service.1.point.2"), t("home.service.1.point.3")],
      image: { src: "/media/Almacen.webp", alt: t("home.service.1.img_alt") },
    },
    {
      titleKey: "home.service.2.title",
      points: [t("home.service.2.point.1"), t("home.service.2.point.2"), t("home.service.2.point.3")],
      image: { src: "/media/Furgoneta.webp", alt: t("home.service.2.img_alt") },
    },
    {
      titleKey: "home.service.3.title",
      points: [t("home.service.3.point.1"), t("home.service.3.point.2"), t("home.service.3.point.3")],
      image: { src: "/media/Logistica.jpg", alt: t("home.service.3.img_alt") },
    },
  ];

  const coverage = [
    {
      titleKey: "home.coverage.1.title",
      points: [t("home.coverage.1.point.1"), t("home.coverage.1.point.2"), t("home.coverage.1.point.3")],
    },
    {
      titleKey: "home.coverage.2.title",
      points: [t("home.coverage.2.point.1"), t("home.coverage.2.point.2"), t("home.coverage.2.point.3")],
    },
  ];

  return (
    <>
      <StructuredData />
      <SiteHeader variant="home" />

      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-24 pt-6 md:pb-10 md:pt-8">
        <section
          id="inicio"
          aria-labelledby="hero-title"
          className="scroll-mt-28 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm md:scroll-mt-36 md:p-8"
        >
          <h1 id="hero-title" className="text-2xl font-semibold leading-tight text-[#14263a] md:text-4xl">
            {t("home.hero.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#2f4a62] md:text-base">
            {t("home.hero.subtitle")}
          </p>
          <Link
            href="/application"
            className="mt-5 inline-flex items-center rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]"
          >
            {t("home.hero.cta")}
          </Link>
        </section>

        <SectionContainer
          id="servicios"
          title={t("home.section.services")}
          className="scroll-mt-28 [contain-intrinsic-size:1px_850px] [content-visibility:auto] md:scroll-mt-36"
        >
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {services.map((service) => (
              <InfoCard
                key={service.titleKey}
                title={t(service.titleKey)}
                points={service.points}
                image={service.image}
              />
            ))}
          </div>
        </SectionContainer>

        <SectionContainer
          id="cobertura"
          title={t("home.section.coverage")}
          className="scroll-mt-28 [contain-intrinsic-size:1px_450px] [content-visibility:auto] md:scroll-mt-36"
        >
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {coverage.map((country) => (
              <InfoCard key={country.titleKey} title={t(country.titleKey)} points={country.points} />
            ))}
          </div>
        </SectionContainer>

        <SectionContainer
          title={t("home.section.why")}
          className="[contain-intrinsic-size:1px_380px] [content-visibility:auto]"
        >
          <ul className="mt-4 list-inside list-disc space-y-3 text-sm text-[#2f4a62] md:text-base">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: t(`home.why.${i}`) }} />
            ))}
          </ul>
        </SectionContainer>

        <SectionContainer
          id="contacto"
          title={t("home.section.contact")}
          className="scroll-mt-28 [contain-intrinsic-size:1px_280px] [content-visibility:auto] md:scroll-mt-36"
        >
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-[#2f4a62] md:text-base">
            <li className="leading-relaxed">Email: {t("home.contact.email")}</li>
            <li className="leading-relaxed">{t("home.contact.la")}</li>
            <li className="leading-relaxed">{t("home.contact.zgz")}</li>
          </ul>
        </SectionContainer>
      </main>
    </>
  );
}