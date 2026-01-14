import React from 'react';

export interface CardGridItem {
  id: string | number;
  image?: string | null;
  title: string;
  subtitle?: string;
  tags?: string[];
  description?: string;
  extra?: React.ReactNode;
  actions?: React.ReactNode;
}

interface CardGridProps {
  items: CardGridItem[];
  columns?: number;
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({ items, columns = 4, className }) => {
  // Responsive grid: 2 cols mobile, columns md+, gap-3
  const gridClass = `grid grid-cols-2 gap-3 md:grid-cols-${columns} ${className || ''}`;

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          {item.image ? (
            <div className="mb-0 overflow-hidden rounded-t-2xl bg-neutral-100 aspect-[4/3] flex items-center justify-center">
              <img src={item.image} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" />
            </div>
          ) : (
            <div className="mb-0 flex aspect-[4/3] items-center justify-center rounded-t-2xl bg-gradient-to-br from-neutral-100 to-neutral-200">
              <span className="text-neutral-400 text-3xl font-bold">?</span>
            </div>
          )}

          <div className="px-6 py-6 pb-20 flex flex-col h-full">
            {item.subtitle && (
              <p className="text-xs text-neutral-500 font-semibold mb-1 truncate">{item.subtitle}</p>
            )}
            <h3 className="text-lg font-bold text-neutral-900 mb-1 truncate">{item.title}</h3>
            {item.tags && item.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {item.description && (
              <p className="mt-2 text-sm text-neutral-600 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
            <div className="flex-1" />
            {/* Acciones en la parte inferior */}
            {item.actions && (
              <div className="w-full absolute left-0 bottom-0 px-6 pb-6 pt-8 bg-gradient-to-t from-white via-white to-transparent flex items-center gap-2">
                {item.actions}
              </div>
            )}

            {/* Estado en la esquina superior derecha de la imagen */}
            {item.extra && (
              <div className="absolute top-4 right-4 z-10">{item.extra}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};