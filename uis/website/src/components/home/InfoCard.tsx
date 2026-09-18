import Image from "next/image";

interface InfoCardProps {
  title: string;
  points: string[];
  image?: {
    src: string;
    alt: string;
  };
  /** Marcar como above-the-fold (LCP) para usar loading="eager". */
  priority?: boolean;
}

export function InfoCard({ title, points, image, priority }: InfoCardProps) {
  return (
    <article className="flex flex-col rounded-lg border border-[#c89d66] bg-[#e5be83] p-4">
      <div className="flex-1">
        <h3 className="text-base font-semibold text-[#14263a]">{title}</h3>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[#2f4a62]">
          {points.map((point) => (
            <li key={point} className="leading-relaxed">
              {point}
            </li>
          ))}
        </ul>
      </div>
      {image ? (
        <div className="mt-auto pt-4">
          <Image
            src={image.src}
            alt={image.alt}
            width={1000}
            height={667}
            className="h-48 w-full rounded-md object-cover"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
        </div>
      ) : null}
    </article>
  );
}
