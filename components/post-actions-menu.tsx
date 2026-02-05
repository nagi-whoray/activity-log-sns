'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PostActionsMenuProps {
  onEdit: () => void
  onDelete: () => void
}

export function PostActionsMenu({ onEdit, onDelete }: PostActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 w-32 rounded-md border bg-white shadow-lg">
            <button
              onClick={() => {
                onEdit()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4" />
              編集
            </button>
            <button
              onClick={() => {
                onDelete()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              削除
            </button>
          </div>
        </>
      )}
    </div>
  )
}
