interface InfoCardProps {
  title: string;
  points: string[];
  image?: {
    src: string;
    alt: string;
  };
}

export function InfoCard({ title, points, image }: InfoCardProps) {
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
          <img
            src={image.src}
            alt={image.alt}
            className="h-48 w-full rounded-md object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}
    </article>
  );
}
