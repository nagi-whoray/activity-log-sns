'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { UserItem } from '@/types/database'

interface UserItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  item?: UserItem
}

export function UserItemFormDialog({
  open,
  onOpenChange,
  userId,
  item,
}: UserItemFormDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const isEditMode = !!item

  const [productName, setProductName] = useState(item?.product_name || '')
  const [productUrl, setProductUrl] = useState(item?.product_url || '')
  const [usageMethod, setUsageMethod] = useState(item?.usage_method || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && item) {
      setProductName(item.product_name)
      setProductUrl(item.product_url || '')
      setUsageMethod(item.usage_method || '')
    } else if (open && !item) {
      setProductName('')
      setProductUrl('')
      setUsageMethod('')
    }
  }, [open, item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim()) return

    setLoading(true)

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('user_items')
          .update({
            product_name: productName.trim(),
            product_url: productUrl.trim() || null,
            usage_method: usageMethod.trim() || null,
          })
          .eq('id', item.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('user_items').insert({
          user_id: userId,
          product_name: productName.trim(),
          product_url: productUrl.trim() || null,
          usage_method: usageMethod.trim() || null,
        })

        if (error) throw error
      }

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      alert(isEditMode ? 'アイテムの更新に失敗しました' : 'アイテムの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'アイテムを編集' : 'アイテムを追加'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">商品名 *</Label>
            <Input
              id="product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="例: ザバス ホエイプロテイン"
              disabled={loading}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-url">商品URL（任意）</Label>
            <Input
              id="product-url"
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage-method">使用方法・頻度（任意）</Label>
            <textarea
              id="usage-method"
              value={usageMethod}
              onChange={(e) => setUsageMethod(e.target.value)}
              placeholder="例: 毎朝1杯、運動後に1杯"
              className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
              maxLength={500}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || !productName.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : isEditMode ? (
                '保存する'
              ) : (
                '追加する'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
