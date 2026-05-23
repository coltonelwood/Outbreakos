import { Badge } from "@/components/ui/badge";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg" aria-hidden />
      <div className="absolute inset-0 gradient-mesh" aria-hidden />
      <div className="container relative py-20 lg:py-24">
        <Badge variant="default" className="mb-4">
          {eyebrow}
        </Badge>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{description}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
