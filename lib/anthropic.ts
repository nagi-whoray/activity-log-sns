import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

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
