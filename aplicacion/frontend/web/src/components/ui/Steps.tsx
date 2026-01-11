import React from 'react'

type Step = { id: string; title: string; caption?: string }

export function Steps({ steps, active = 0, onSelect }: { steps: Step[]; active?: number; onSelect?: (index: number) => void }) {
  const percent = steps.length > 1 ? (active / (steps.length - 1)) * 100 : 0

  return (
    <div className="my-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative h-20">
          

          <div className="flex items-center justify-center h-full space-x-4">
            {steps.map((s, i) => {
              const isActive = i === active
              const completed = i < active
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center text-center relative">
                    <button
                      type="button"
                      onClick={() => onSelect && onSelect(i)}
                      className={`relative z-20 flex items-center justify-center rounded-full w-12 h-12 transform transition-all duration-300 ease-in-out ${isActive ? 'bg-brand-red text-white border-2 border-brand-red shadow-sm' : 'bg-white border-2 border-neutral-200 text-neutral-400 hover:scale-105'}`}
                      aria-current={isActive}
                      aria-pressed={isActive}
                    >
                      <span className="sr-only">Paso {i + 1}: {s.title}</span>
                        <span aria-hidden="true" className={`font-semibold ${isActive ? 'text-white' : 'text-neutral-400'}`}>{i + 1}</span>
                    </button>

                    <div className={`mt-3 text-sm font-semibold ${isActive ? 'text-neutral-900' : 'text-neutral-700'}`}>{s.title}</div>
                    {s.caption ? <div className="mt-1 text-xs text-neutral-500">{s.caption}</div> : null}
                  </div>

                  {i < steps.length - 1 && (
                    <div className="flex items-center">
                      <div className={`h-0.5 w-20 rounded-full ${i < active ? 'bg-gradient-to-r from-[#ff6b6b] to-[#d7263d]' : 'bg-neutral-200'}`} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Steps     