import { Link } from "react-router-dom";
import { InfoCard } from "../components/home/InfoCard";
import { SectionContainer } from "../components/home/SectionContainer";
import { StructuredData } from "../components/home/StructuredData";
import { SiteFooter } from "../components/layout/SiteFooter";
import { SiteHeader } from "../components/layout/SiteHeader";

const services = [
  {
    title: "Gestión de Almacenes",
    points: [
      "Almacenamiento, picking y packing",
      "Inventario en tiempo real",
      "Operamos almacenes en Los Ángeles y Zaragoza",
    ],
    image: { src: "/media/Almacen.webp", alt: "Gestión de Almacenes" },
  },
  {
    title: "Entregas de Última Milla",
    points: [
      "Red de carriers certificados en ambos países",
      "Seguimiento unificado de envíos",
      "Gestión de incidencias y devoluciones",
    ],
    image: { src: "/media/Furgoneta.webp", alt: "Entregas de Última Milla" },
  },
  {
    title: "Logística Inversa",
    points: [
      "Gestión completa de devoluciones",
      "Inspección y reacondicionamiento",
      "Integración con tu plataforma de ventas",
    ],
    image: { src: "/media/Logistica.jpg", alt: "Logística Inversa" },
  },
];

const coverage = [
  {
    title: "Estados Unidos",
    points: ["Almacén en Los Ángeles", "Cobertura nacional", "Carriers: UPS, FedEx, DHL"],
  },
  {
    title: "España",
    points: ["Almacén en Zaragoza", "Cobertura peninsular e islas", "Carriers: MRW, SEUR, DHL"],
  },
];

export function HomePage() {
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
            Logística que escala con tu e-commerce
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#2f4a62] md:text-base">
            Gestión de almacenes, entregas de última milla y logística inversa en Estados Unidos y España. Más de 15
            años ayudando a marcas de moda, electrónica y cosmética a crecer sin preocuparse por la operación.
          </p>
          <Link
            to="/application"
            className="mt-5 inline-flex items-center rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]"
          >
            Solicitar información
          </Link>
        </section>

        <SectionContainer
          id="servicios"
          title="Servicios"
          className="scroll-mt-28 [contain-intrinsic-size:1px_850px] [content-visibility:auto] md:scroll-mt-36"
        >
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {services.map((service) => (
              <InfoCard
                key={service.title}
                title={service.title}
                points={service.points}
                image={service.image}
              />
            ))}
          </div>
        </SectionContainer>

        <SectionContainer
          id="cobertura"
          title="Cobertura"
          className="scroll-mt-28 [contain-intrinsic-size:1px_450px] [content-visibility:auto] md:scroll-mt-36"
        >
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {coverage.map((country) => (
              <InfoCard key={country.title} title={country.title} points={country.points} />
            ))}
          </div>
        </SectionContainer>

        <SectionContainer
          title="¿Por qué TrackFlow?"
          className="[contain-intrinsic-size:1px_380px] [content-visibility:auto]"
        >
          <ul className="mt-4 list-inside list-disc space-y-3 text-sm text-[#2f4a62] md:text-base">
            <li className="leading-relaxed">
              <strong>Operación binacional:</strong> El único operador con infraestructura propia en Estados Unidos y
              España
            </li>
            <li className="leading-relaxed">
              <strong>+130 profesionales</strong> dedicados a tu logística
            </li>
            <li className="leading-relaxed">
              <strong>Tecnología propia</strong> para visibilidad total de tu inventario
            </li>
            <li className="leading-relaxed">
              <strong>Especialización e-commerce</strong> en moda, electrónica y cosmética
            </li>
          </ul>
        </SectionContainer>

        <SectionContainer
          id="contacto"
          title="Contacto"
          className="scroll-mt-28 [contain-intrinsic-size:1px_280px] [content-visibility:auto] md:scroll-mt-36"
        >
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-[#2f4a62] md:text-base">
            <li className="leading-relaxed">Email: comercial@trackflow.com</li>
            <li className="leading-relaxed">Los Ángeles: +1 213 555 0147</li>
            <li className="leading-relaxed">Zaragoza: +34 976 123 456</li>
          </ul>
        </SectionContainer>
      </main>

      <SiteFooter />
    </>
  );
}
