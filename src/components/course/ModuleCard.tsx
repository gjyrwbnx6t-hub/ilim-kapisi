interface ModuleCardProps {
  icon: string;
  title: string;
  description: string;
  /** İçerik henüz yoksa küçük "Yakında eklenecek" etiketi gösterilir. */
  available?: boolean;
}

export default function ModuleCard({
  icon,
  title,
  description,
  available = false,
}: ModuleCardProps) {
  return (
    <article className="flex h-full flex-col items-center rounded-xl border border-slate-200 bg-white p-8 text-center transition-colors hover:border-primary">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
        {icon}
      </div>

      <h3 className="mb-2 text-lg font-bold text-primary">{title}</h3>
      <p className="text-sm text-surface-muted">{description}</p>

      {!available && (
        <span className="mt-4 inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-medium text-slate-500">
          Yakında eklenecek
        </span>
      )}
    </article>
  );
}
