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

async function deleteOgpCache(urlPattern?: string) {
  if (urlPattern) {
    // 特定のURLパターンに一致するキャッシュを削除
    const { data, error, count } = await supabase
      .from('ogp_cache')
      .delete()
      .ilike('url', `%${urlPattern}%`)
      .select()

    if (error) {
      console.error('削除エラー:', error.message, error.details, error.hint)
      return
    }
    console.log(`削除完了: ${data?.length || 0}件`)
    if (data) console.log('削除したURL:', data.map(d => d.url))
  } else {
    // 全キャッシュを削除
    const { data, error } = await supabase
      .from('ogp_cache')
      .delete()
      .neq('url', '')
      .select()

    if (error) {
      console.error('削除エラー:', error.message, error.details, error.hint)
      return
    }
    console.log(`全キャッシュ削除完了: ${data?.length || 0}件`)
  }
}

// コマンドライン引数からURLパターンを取得
const urlPattern = process.argv[2]
deleteOgpCache(urlPattern)
