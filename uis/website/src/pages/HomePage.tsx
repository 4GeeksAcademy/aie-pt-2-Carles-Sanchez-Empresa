import { Link } from "react-router-dom";
import { InfoCard } from "../components/home/InfoCard";
import { SectionContainer } from "../components/home/SectionContainer";
import { StructuredData } from "../components/home/StructuredData";
import { SiteFooter } from "../components/layout/SiteFooter";
import { SiteHeader } from "../components/layout/SiteHeader";
import { useTranslation } from "../i18n";

const servicesKeys = ["warehouse", "lastMile", "reverse"] as const;

const coverageKeys = ["us", "spain"] as const;

export function HomePage() {
  const { t } = useTranslation();

  const services = servicesKeys.map((key) => ({
    key,
    title: t.services[key].title,
    points: t.services[key].points,
    image: {
      src:
        key === "warehouse"
          ? "/media/Almacen.webp"
          : key === "lastMile"
          ? "/media/Furgoneta.webp"
          : "/media/Logistica.jpg",
      alt: t.services[key].imgAlt,
    },
  }));

  const coverage = coverageKeys.map((key) => ({
    title: t.coverage[key].title,
    points: t.coverage[key].points,
  }));

  const whyPoints = t.whyTrackFlow.points;
  const contactItems = [t.contact.email, t.contact.losAngeles, t.contact.zaragoza];

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
            {t.hero.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#2f4a62] md:text-base">
            {t.hero.description}
          </p>
          <Link
            to="/application"
            className="mt-5 inline-flex items-center rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]"
          >
            {t.hero.cta}
          </Link>
        </section>

        <SectionContainer
          id="servicios"
          title={t.services.title}
          className="scroll-mt-28 [contain-intrinsic-size:1px_850px] [content-visibility:auto] md:scroll-mt-36"
        >
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {services.map((service) => (
              <InfoCard
                key={service.key}
                title={service.title}
                points={service.points}
                image={service.image}
              />
            ))}
          </div>
        </SectionContainer>

        <SectionContainer
          id="cobertura"
          title={t.coverage.title}
          className="scroll-mt-28 [contain-intrinsic-size:1px_450px] [content-visibility:auto] md:scroll-mt-36"
        >
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {coverage.map((country) => (
              <InfoCard key={country.title} title={country.title} points={country.points} />
            ))}
          </div>
        </SectionContainer>

        <SectionContainer
          title={t.whyTrackFlow.title}
          className="[contain-intrinsic-size:1px_380px] [content-visibility:auto]"
        >
          <ul className="mt-4 list-inside list-disc space-y-3 text-sm text-[#2f4a62] md:text-base">
            {whyPoints.map((point, idx) => (
              <li key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: point }} />
            ))}
          </ul>
        </SectionContainer>

        <SectionContainer
          id="contacto"
          title={t.contact.title}
          className="scroll-mt-28 [contain-intrinsic-size:1px_280px] [content-visibility:auto] md:scroll-mt-36"
        >
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-[#2f4a62] md:text-base">
            {contactItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        </SectionContainer>
      </main>

      <SiteFooter />
    </>
  );
}
