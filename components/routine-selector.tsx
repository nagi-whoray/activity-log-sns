'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Clock, RotateCcw } from 'lucide-react'
import { UserRoutine, ACTIVITY_CATEGORY_LABELS } from '@/types/database'

interface RoutineSelectorProps {
  routines: UserRoutine[]
  selectedRoutineId: string | null
  onSelect: (routine: UserRoutine | null) => void
  disabled?: boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  workout: '💪',
  study: '📚',
  beauty: '✨',
  meal: '🍽️',
  work: '💼',
  dev: '💻',
}

export function RoutineSelector({
  routines,
  selectedRoutineId,
  onSelect,
  disabled,
}: RoutineSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId) || null

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (routine: UserRoutine) => {
    onSelect(routine)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(null)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all ${
          selectedRoutine
            ? 'border-indigo-300 bg-indigo-50'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {selectedRoutine ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-sm font-medium truncate">{selectedRoutine.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {CATEGORY_ICONS[selectedRoutine.category]} {ACTIVITY_CATEGORY_LABELS[selectedRoutine.category]}
            </span>
            {selectedRoutine.duration_minutes && (
              <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {selectedRoutine.duration_minutes}分
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">ルーティンを選択（任意）</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {selectedRoutine && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {routines.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              ルーティンがありません
            </div>
          ) : (
            routines.map((routine) => (
              <button
                key={routine.id}
                type="button"
                onClick={() => handleSelect(routine)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                  routine.id === selectedRoutineId ? 'bg-indigo-50' : ''
                }`}
              >
                <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{routine.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {CATEGORY_ICONS[routine.category]} {ACTIVITY_CATEGORY_LABELS[routine.category]}
                    </span>
                    {routine.duration_minutes && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {routine.duration_minutes}分
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
