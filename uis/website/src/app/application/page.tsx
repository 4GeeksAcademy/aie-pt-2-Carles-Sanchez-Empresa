"use client";

import { ApplicationForm } from "@/components/application/ApplicationForm";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useTranslation } from "@/lib/i18n";

export default function ApplicationPage() {
  const { t } = useTranslation();
  return (
    <>
      <SiteHeader variant="application" />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-semibold leading-tight text-[#14263a] md:text-3xl">{t("app.page.title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#2f4a62] md:text-base">
            {t("app.page.subtitle")}
          </p>

          <ApplicationForm />
        </section>
      </main>
    </>
  );
}