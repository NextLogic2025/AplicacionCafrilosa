import React from 'react'

type Step = { id: string; title: string; caption?: string }

export function Steps({ steps, active = 0, onSelect }: { steps: Step[]; active?: number; onSelect?: (index: number) => void }) {
  const percent = steps.length > 1 ? (active / (steps.length - 1)) * 100 : 0

  return (
    <div className="my-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative py-6">
          {/* background connecting line */}
          <div className="absolute left-8 right-8 top-6 h-0.5 bg-brand-red-50" />
          {/* animated progress */}
          <div
            className="absolute left-8 top-6 h-0.5 bg-gradient-to-r from-brand-red to-brand-red700 transition-all duration-400 ease-in-out"
            style={{ width: `${percent}%` }}
          />

          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const isActive = i === active
              const completed = i < active
              return (
                <div key={s.id} className="flex-1 flex flex-col items-center text-center relative">
                  <button
                    type="button"
                    onClick={() => onSelect && onSelect(i)}
                    className={`relative z-20 flex items-center justify-center rounded-full w-12 h-12 transform transition-all duration-300 ease-in-out ${isActive ? 'bg-gradient-to-br from-brand-red to-brand-red700 shadow-2xl scale-110' : 'bg-white border border-black text-transparent hover:scale-105'}`}
                    aria-current={isActive}
                    aria-pressed={isActive}
                  >
                    <span className="sr-only">Paso {i + 1}: {s.title}</span>
                    {/* No visible number or icon - purely colored circle */}
                    <span aria-hidden="true" className="w-full h-full block" />
                  </button>

                  <div className={`mt-3 text-sm font-semibold ${isActive ? 'text-neutral-900' : 'text-neutral-700'}`}>{s.title}</div>
                  {s.caption ? <div className="mt-1 text-xs text-neutral-500">{s.caption}</div> : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Steps
