'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ActivityCalendarProps {
  activityDates: string[]
  selectedDate: string | null
  userId: string
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export function ActivityCalendar({ activityDates, selectedDate, userId }: ActivityCalendarProps) {
  const router = useRouter()

  const initialDate = selectedDate ? new Date(selectedDate) : new Date()
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth())

  const activityDateSet = useMemo(() => new Set(activityDates), [activityDates])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const today = new Date()
  const todayString = formatDateString(today.getFullYear(), today.getMonth(), today.getDate())

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1)
      setCurrentMonth(11)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleDateClick = (day: number) => {
    const dateString = formatDateString(currentYear, currentMonth, day)
    if (dateString === selectedDate) {
      router.push(`/users/${userId}`)
    } else {
      router.push(`/users/${userId}?date=${dateString}`)
    }
  }

  const handleClearFilter = () => {
    router.push(`/users/${userId}`)
  }

  // カレンダーグリッドの行を構築
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        {/* ヘッダー: 月ナビゲーション */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">
            {currentYear}年{currentMonth + 1}月
          </span>
          <Button variant="ghost" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-9" />
            }

            const dateString = formatDateString(currentYear, currentMonth, day)
            const hasActivity = activityDateSet.has(dateString)
            const isSelected = dateString === selectedDate
            const isToday = dateString === todayString
            const dayOfWeek = (firstDay + day - 1) % 7

            return (
              <button
                key={day}
                onClick={() => hasActivity && handleDateClick(day)}
                className={`
                  relative h-9 flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                  ${hasActivity && !isSelected ? 'bg-blue-50 text-blue-700 font-semibold cursor-pointer hover:bg-blue-100 ring-1 ring-blue-200' : ''}
                  ${!hasActivity ? 'cursor-default text-gray-400' : ''}
                  ${isSelected ? 'bg-blue-500 text-white font-semibold cursor-pointer hover:bg-blue-600 ring-1 ring-blue-500' : ''}
                  ${isToday && !isSelected && !hasActivity ? 'font-bold text-gray-700' : ''}
                  ${isToday && !isSelected && hasActivity ? 'ring-2 ring-blue-400' : ''}
                  ${dayOfWeek === 0 && !isSelected && !hasActivity ? 'text-red-300' : ''}
                  ${dayOfWeek === 6 && !isSelected && !hasActivity ? 'text-blue-300' : ''}
                `}
              >
                <span className="leading-none">{day}</span>
              </button>
            )
          })}
        </div>

        {/* フィルタ表示 */}
        {selectedDate && (
          <div className="mt-2 pt-2 border-t">
            <button
              onClick={handleClearFilter}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              <span>
                {new Date(selectedDate).toLocaleDateString('ja-JP', {
                  month: 'long',
                  day: 'numeric',
                })}
                の投稿を表示中
              </span>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
