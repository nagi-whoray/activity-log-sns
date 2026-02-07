import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// .env.localを読み込む
const envContent = readFileSync('.env.local', 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function expireOgpCache(urlPattern?: string) {
  const pastDate = new Date(Date.now() - 1000).toISOString() // 1秒前（期限切れ）

  if (urlPattern) {
    const { data, error } = await supabase
      .from('ogp_cache')
      .update({ expires_at: pastDate })
      .ilike('url', `%${urlPattern}%`)
      .select()

    if (error) {
      console.error('更新エラー:', error.message, error.details, error.hint)
      return
    }
    console.log(`キャッシュを無効化しました: ${data?.length || 0}件`)
    data?.forEach(d => console.log(`  - ${d.url}`))
  } else {
    const { data, error } = await supabase
      .from('ogp_cache')
      .update({ expires_at: pastDate })
      .neq('url', '')
      .select()

    if (error) {
      console.error('更新エラー:', error.message, error.details, error.hint)
      return
    }
    console.log(`全キャッシュを無効化しました: ${data?.length || 0}件`)
  }
}

const urlPattern = process.argv[2]
expireOgpCache(urlPattern)
