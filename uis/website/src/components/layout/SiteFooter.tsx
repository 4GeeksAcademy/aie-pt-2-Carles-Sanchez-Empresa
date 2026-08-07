export function SiteFooter() {
  return (
    <footer className="border-t border-[#c89d66] bg-[#f3ddba]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-[#2f4a62] md:flex-row md:items-center md:justify-between">
        <p>© 2025 TrackFlow. Todos los derechos reservados.</p>
        <a
          href="https://linkedin.com/company/trackflow"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4 hover:text-[#1d4f7a]"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  );
}
