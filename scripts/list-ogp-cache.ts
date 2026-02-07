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

async function listOgpCache() {
  const { data, error } = await supabase
    .from('ogp_cache')
    .select('url, title, expires_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('取得エラー:', error)
    return
  }

  console.log(`キャッシュ一覧 (最新20件):`)
  data?.forEach((item, i) => {
    console.log(`${i + 1}. ${item.url}`)
    console.log(`   タイトル: ${item.title}`)
    console.log(`   有効期限: ${item.expires_at}`)
  })
  console.log(`\n合計: ${data?.length || 0}件`)
}

listOgpCache()
