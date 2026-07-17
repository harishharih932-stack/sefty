import { Github, Instagram, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-muted/40">
      <div className="mx-auto max-w-5xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Developed by <span className="font-semibold text-foreground">Harish</span> — Full Stack Web Developer
        </p>
        <div className="flex items-center gap-4">
          <a href="tel:9980925121" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <Phone className="size-3.5" aria-hidden /> 9980925121
          </a>
          <a
            href="https://instagram.com/harishh1181"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Instagram className="size-3.5" aria-hidden /> harishh1181
          </a>
          <a
            href="https://github.com/harishharih932-stack"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Github className="size-3.5" aria-hidden /> GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
