import Anthropic from '@anthropic-ai/sdk'
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages'
import { readFileSync } from 'fs'
import { join } from 'path'

/** プライマリモデル → フォールバックモデルの順に試行 */
const MODEL_PRIMARY = 'claude-haiku-4-5-20251001'
const MODEL_FALLBACK = 'claude-3-haiku-20240307'

/**
 * .env.localから直接環境変数を読み取る
 * Claude Codeがシェル環境変数にANTHROPIC_API_KEY=""（空文字列）を設定するため、
 * process.envの値が.env.localの値を上書きしてしまう問題を回避する
 */
function getEnvFromFile(key: string): string | undefined {
  try {
    const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of envFile.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match && match[1].trim() === key) {
        const value = match[2].trim()
        if (value) return value
      }
    }
  } catch {
    // .env.localが見つからない場合はフォールバック
  }
  return undefined
}

/**
 * Anthropicクライアントを作成する
 * .env.localのAPIキーを優先的に使用
 */
export function createAnthropicClient(): Anthropic {
  const apiKey = getEnvFromFile('ANTHROPIC_API_KEY') || process.env['ANTHROPIC_API_KEY'] || undefined
  return new Anthropic({ apiKey })
}

/**
 * モデルフォールバック付きでメッセージを生成する
 * プライマリモデルが失敗した場合、フォールバックモデルで再試行する
 */
export async function createMessageWithFallback(
  client: Anthropic,
  params: Omit<MessageCreateParamsNonStreaming, 'model'>
): Promise<Anthropic.Message> {
  try {
    return await client.messages.create({ ...params, model: MODEL_PRIMARY })
  } catch (error) {
    console.warn(`Primary model (${MODEL_PRIMARY}) failed, trying fallback (${MODEL_FALLBACK}):`, error instanceof Error ? error.message : error)
    return await client.messages.create({ ...params, model: MODEL_FALLBACK })
  }
}
