import { type ReactNode } from "react";

interface SectionContainerProps {
  id?: string;
  title: string;
  className?: string;
  children: ReactNode;
}

export function SectionContainer({ id, title, className = "", children }: SectionContainerProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={`rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm md:p-8 ${className}`.trim()}
    >
      <h2 id={id ? `${id}-title` : undefined} className="text-xl font-semibold text-[#14263a] md:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}
