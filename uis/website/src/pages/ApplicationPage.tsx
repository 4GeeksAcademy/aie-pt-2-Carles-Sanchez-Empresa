import { ApplicationForm } from "../components/application/ApplicationForm";
import { SiteHeader } from "../components/layout/SiteHeader";

export function ApplicationPage() {
  return (
    <>
      <SiteHeader variant="application" />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-semibold leading-tight text-[#14263a] md:text-3xl">Formulario de solicitud</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#2f4a62] md:text-base">
            Completa este formulario para que nuestro equipo comercial pueda ofrecerte una propuesta adaptada a tu
            empresa.
          </p>

          <ApplicationForm />
        </section>
      </main>
    </>
  );
}
