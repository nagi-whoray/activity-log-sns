# Activity Log SNS - 開発メモ

このドキュメントは、開発者とAIアシスタントのためのプロジェクト情報を記録しています。

## プロジェクト概要

Next.js 14 + Supabaseを使った活動ログSNSアプリケーション。ユーザーは毎日の活動を記録し、タイムライン形式で共有できます。

### 技術スタック
- **フロントエンド**: Next.js 14 (App Router), React, TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **バックエンド**: Supabase (Auth, Database, RLS)
- **状態管理**: Server Components + Client Components

## プロジェクト構成

### ディレクトリ構造の意図

```
app/
  ├── auth/callback/      # Supabase認証後のコールバック処理
  ├── login/              # 未認証ユーザー向けログインページ
  └── page.tsx            # メインページ（認証必須）

components/
  ├── ui/                      # shadcn/uiの再利用可能コンポーネント
  ├── header.tsx               # [Client] ヘッダー（ログアウト機能）
  ├── login-form.tsx           # [Client] ログイン/登録フォーム
  ├── activity-log-form.tsx    # [Client] 活動ログ投稿フォーム（画像アップロード対応）
  ├── activity-log-list.tsx    # [Client] 活動ログ一覧表示（画像表示対応）
  ├── comment-section.tsx      # [Client] コメント機能
  ├── ImageUpload.tsx          # [Client] 画像アップロードコンポーネント
  └── ActivityImages.tsx       # [Client] 画像表示・拡大モーダル

lib/
  ├── supabase/
  │   ├── client.ts       # クライアントコンポーネント用
  │   └── server.ts       # サーバーコンポーネント/API用
  ├── supabase-storage.ts # Supabase Storage操作関数
  └── utils.ts            # shadcn/ui用ユーティリティ

types/
  ├── database.ts         # Supabaseテーブルスキーマ型定義
  ├── index.ts            # アプリケーション用型定義
  └── storage.ts          # 画像アップロード関連の型定義
```

## セットアップ済みの機能

### 認証フロー
1. **middleware.ts**: 全ルートで認証状態をチェック
   - 未認証 → `/login`にリダイレクト
   - 認証済みで`/login`アクセス → `/`にリダイレクト

2. **ログイン/登録**: [components/login-form.tsx](components/login-form.tsx)
   - メールアドレス + パスワード認証
   - サインアップ時は確認メール送信
   - エラーハンドリング実装済み

3. **セッション管理**: Supabase SSRを使用
   - Cookieベースのセッション
   - 自動リフレッシュ対応

### データベース構造

スキーマ定義: [supabase-schema.sql](supabase-schema.sql)

#### テーブル: profiles（ユーザー情報）
```sql
id            UUID PRIMARY KEY (auth.users参照)
email         TEXT NOT NULL
username      TEXT NOT NULL
display_name  TEXT
avatar_url    TEXT
bio           TEXT
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### テーブル: activity_logs（活動ログ）
```sql
id            UUID PRIMARY KEY
user_id       UUID (profiles参照)
category      activity_category NOT NULL  -- 'workout' | 'study' | 'beauty'
title         TEXT NOT NULL
content       TEXT NOT NULL
activity_date DATE DEFAULT CURRENT_DATE
image_url     TEXT
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### テーブル: likes（いいね）
```sql
id              UUID PRIMARY KEY
activity_log_id UUID (activity_logs参照)
user_id         UUID (profiles参照)
created_at      TIMESTAMP
UNIQUE(activity_log_id, user_id)  -- 同じ投稿に複数回いいね不可
```

#### テーブル: comments（コメント）
```sql
id              UUID PRIMARY KEY
activity_log_id UUID (activity_logs参照)
user_id         UUID (profiles参照)
content         TEXT NOT NULL
parent_id       UUID (comments参照、ネスト用)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### カテゴリ（ENUM型）
| 値 | 日本語 | アイコン |
|---|--------|---------|
| `workout` | 筋トレ | 💪 |
| `study` | 勉強 | 📚 |
| `beauty` | 美容 | ✨ |

#### RLS (Row Level Security)
- **profiles**: 全員が閲覧可能、本人のみ更新可能
- **activity_logs**: 全員が閲覧可能、本人のみ作成/更新/削除可能
- **likes**: 全員が閲覧可能、認証ユーザーが作成可能、本人のみ削除可能
- **comments**: 全員が閲覧可能、認証ユーザーが作成可能、本人のみ更新/削除可能

#### トリガー
- `handle_new_user()`: 新規ユーザー登録時に自動でprofilesテーブルにレコード作成
- `handle_updated_at()`: 各テーブルのupdated_atを自動更新

#### プロフィール自動作成
投稿時にプロフィールが存在しない場合、[activity-log-form.tsx](components/activity-log-form.tsx) で自動作成される

### Supabase Storage（画像保存）

#### バケット: activity-images
- **用途**: 活動ログに添付する画像の保存
- **公開設定**: Public（画像URLで直接アクセス可能）
- **セットアップSQL**: [supabase-storage-setup.sql](supabase-storage-setup.sql)

#### Storageポリシー
| 操作 | 許可対象 | 条件 |
|------|----------|------|
| INSERT | 認証ユーザー | 自分のフォルダ（user_id）にのみ |
| SELECT | 全員 | - |
| DELETE | 認証ユーザー | 自分のフォルダのファイルのみ |
| UPDATE | 認証ユーザー | 自分のフォルダのファイルのみ |

#### 画像投稿機能

**関連ファイル:**
- [lib/supabase-storage.ts](lib/supabase-storage.ts) - Storage操作関数
- [types/storage.ts](types/storage.ts) - 型定義・定数
- [components/ImageUpload.tsx](components/ImageUpload.tsx) - アップロードUI
- [components/ActivityImages.tsx](components/ActivityImages.tsx) - 画像表示・モーダル

**機能:**
- 画像形式: JPEG, PNG, GIF, WebP
- 最大ファイルサイズ: 5MB
- 最大枚数: 3枚/投稿
- クライアント側圧縮: browser-image-compression使用（1MB以下、1920px以下）
- 画像URLはJSON配列として `activity_logs.image_url` に保存

**Next.js画像最適化:**
- [next.config.mjs](next.config.mjs) でSupabase Storageドメインを許可設定済み

### UIコンポーネント

#### shadcn/ui コンポーネント
以下のコンポーネントが実装済み：
- **Button** ([components/ui/button.tsx](components/ui/button.tsx))
- **Card** ([components/ui/card.tsx](components/ui/card.tsx))
- **Input** ([components/ui/input.tsx](components/ui/input.tsx))
- **Label** ([components/ui/label.tsx](components/ui/label.tsx))
- **Dialog** ([components/ui/dialog.tsx](components/ui/dialog.tsx)) - 画像拡大モーダル用

新しいshadcn/uiコンポーネントを追加する場合：
```bash
npx shadcn@latest add [component-name]
```

## 重要な設計判断

### 1. Server Components vs Client Components
- **ページレベル**: Server Components（データフェッチ）
- **インタラクティブ**: Client Components（フォーム、ボタン）
- [app/page.tsx](app/page.tsx)でデータ取得 → Propsで子コンポーネントに渡す

### 2. Supabaseクライアントの使い分け
- **Server Components/API**: `lib/supabase/server.ts`
  - Cookie処理が必要
  - `await cookies()`を使用（Next.js 15対応）
- **Client Components**: `lib/supabase/client.ts`
  - ブラウザで実行
  - リアルタイム更新に使用

### 3. 認証フロー
- ミドルウェアで全体的な認証チェック
- 各ページで個別の権限チェックは不要（ミドルウェアで保証）

## 開発時の注意点

### 環境変数
以下の環境変数が必須：
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**注意**: `NEXT_PUBLIC_`プレフィックスはクライアント側でも使用可能にする

### Supabaseの初期設定が必要
アプリを動作させる前に以下を実施：
1. Supabaseプロジェクト作成
2. SQL実行（[README.md](README.md)参照）
3. 環境変数設定

### 型安全性
- [types/database.ts](types/database.ts)がSupabaseスキーマと一致している必要がある
- スキーマ変更時は型定義も更新
- Supabase CLIで自動生成も可能：
  ```bash
  npx supabase gen types typescript --project-id [project-id] > types/database.ts
  ```

## よくある問題とトラブルシューティング

### 1. "Invalid API key"エラー
- `.env.local`の環境変数を確認
- 開発サーバーを再起動（環境変数変更後は必須）

### 2. 投稿一覧が表示されない
- Supabaseのテーブルが作成されているか確認
- RLSポリシーが正しく設定されているか確認
- ブラウザのConsoleでエラーチェック

### 3. ログイン後にリダイレクトされない
- [middleware.ts](middleware.ts)の`matcher`設定を確認
- Cookieが正しく設定されているか確認

### 4. 型エラー: "Type instantiation is excessively deep"
- TypeScriptのバージョンを確認（5.0以上推奨）
- `tsconfig.json`で`skipLibCheck: true`を設定

## 次の開発ステップ

### 優先度: 高
1. **プロフィール編集機能**
   - `/profile/edit`ページ作成
   - アバター画像アップロード（Supabase Storage）

2. **投稿の編集・削除機能**
   - 投稿カードにメニューボタン追加
   - 本人のみ表示

3. **エラーハンドリングの改善**
   - トースト通知の実装（sonner推奨）
   - エラーバウンダリーの追加

### 優先度: 中
4. ~~**いいね機能**~~ ✅ 実装済み
   - `likes`テーブル追加
   - 楽観的UI更新

5. ~~**コメント機能**~~ ✅ 実装済み
   - `comments`テーブル追加
   - コメント投稿・削除機能

6. **無限スクロール**
   - React Intersection Observer使用
   - ページネーション実装

### 優先度: 低
7. **リアルタイム更新**
   - Supabase Realtime使用
   - 新規投稿の自動表示

8. **フォロー機能**
   - `follows`テーブル追加
   - タイムラインのフィルタリング

9. **検索機能**
   - 投稿の全文検索
   - ユーザー検索

## データベーススキーマ拡張案

### follows テーブル（未実装）
```sql
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
```

## パフォーマンス最適化のヒント

1. **画像最適化**: Next.jsの`<Image>`コンポーネント使用
2. **ルートキャッシング**: Server Componentsは自動でキャッシュされる
3. **データベースインデックス**: よく検索するカラムにインデックス追加
4. **Supabaseクエリ最適化**: 必要なカラムのみselect

## セキュリティチェックリスト

- [x] RLS有効化
- [x] 環境変数は`.env.local`（Gitにコミットしない）
- [x] XSS対策（Reactのデフォルト保護）
- [x] CSRF対策（Supabaseの組み込み保護）
- [ ] レート制限（将来実装予定）
- [ ] 入力バリデーション強化（将来実装予定）

## プロジェクト設定情報

### GitHubリポジトリ
- **リポジトリURL**: https://github.com/nagi-whoray/activity-log-sns
- **オーナー**: nagi-whoray
- **初回コミット**: 2026-02-04
- **デフォルトブランチ**: main

### Supabase設定
- **プロジェクトURL**: `https://eryskzojvhzffszreycd.supabase.co`
- **リージョン**: Northeast Asia (Tokyo)
- **セットアップ完了日**: 2026-02-03

### 環境変数
環境変数は [.env.local](.env.local) に設定済み：
```env
NEXT_PUBLIC_SUPABASE_URL=https://eryskzojvhzffszreycd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<設定済み>
```

**重要**: `.env.local`はGitにコミットされません（`.gitignore`で除外済み）

## デプロイメント

### Vercelへのデプロイ（推奨）
1. [Vercel](https://vercel.com)でアカウント作成
2. GitHubリポジトリと連携
3. 環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. デプロイボタンをクリック

**注意事項**:
- Vercelは自動的にmainブランチへのpush時に再デプロイされる
- プレビューデプロイは各プルリクエストに自動生成される
- 環境変数はVercelダッシュボードで管理

### デプロイ前チェックリスト
- [ ] 本番環境用の環境変数を設定
- [ ] ビルドが成功することを確認（`npm run build`）
- [ ] Supabase RLSが有効化されているか確認
- [ ] `.env.local`が`.gitignore`に含まれているか確認
- [ ] エラーバウンダリーの実装（推奨）

### その他のデプロイオプション
- **Netlify**: 同様にGitHub連携可能
- **AWS Amplify**: AWSエコスystem使用時
- **自己ホスティング**: `npm run build && npm start`

## セットアップ履歴

### 初期セットアップ (2026-02-03)
1. ✅ Supabaseプロジェクト作成
2. ✅ 環境変数設定（`.env.local`）
3. ✅ データベーステーブル作成
   - 使用ファイル: [supabase-setup.sql](supabase-setup.sql)
   - 作成テーブル: `profiles`, `posts`
   - RLSポリシー設定完了
   - トリガー設定完了（新規ユーザー自動プロフィール作成）
   - インデックス作成完了（パフォーマンス最適化）
4. ✅ 型定義ファイル確認（[types/database.ts](types/database.ts)、[types/index.ts](types/index.ts)）
5. ✅ 開発サーバー起動確認

### GitHubリポジトリ作成 (2026-02-04)
1. ✅ GitHub CLI (gh) インストール
2. ✅ GitHub認証完了（nagi-whorayアカウント）
3. ✅ GitHubリポジトリ作成（public）
4. ✅ 初回コミット・プッシュ完了
   - コミットID: `29366ec`
   - 26ファイル変更（1,751行追加、143行削除）
   - 主な内容：
     - Supabase認証システム実装
     - 投稿機能実装（作成・一覧表示）
     - shadcn/ui UIコンポーネント
     - 認証ミドルウェア
     - データベーススキーマ

### 活動ログ機能拡張 (2026-02-04)
1. ✅ データベーススキーマ再設計
   - 使用ファイル: [supabase-schema.sql](supabase-schema.sql)
   - `posts` → `activity_logs` に変更
   - カテゴリ（筋トレ/勉強/美容）、タイトル、活動日を追加
   - `likes` テーブル追加
   - `comments` テーブル追加
2. ✅ 投稿フォーム刷新
   - [activity-log-form.tsx](components/activity-log-form.tsx)
   - カテゴリ選択UI、タイトル入力、日付選択
   - プロフィール自動作成機能
3. ✅ いいね機能実装
   - [activity-log-list.tsx](components/activity-log-list.tsx) 内 `LikeButton`
   - 楽観的UI更新
4. ✅ コメント機能実装
   - [comment-section.tsx](components/comment-section.tsx)
   - コメント投稿・削除
5. ✅ GitHubプッシュ完了
   - コミットID: `216badd`

### 画像投稿機能追加 (2026-02-04)
1. ✅ パッケージインストール
   - `browser-image-compression` - クライアント側画像圧縮
   - `@radix-ui/react-dialog` - 画像拡大モーダル（shadcn/ui dialog）
2. ✅ Supabase Storage設定
   - Supabase CLI (`brew install supabase/tap/supabase`)
   - `activity-images` バケット作成
   - RLSポリシー設定
   - 使用ファイル: [supabase-storage-setup.sql](supabase-storage-setup.sql)
3. ✅ Storage操作関数作成
   - [lib/supabase-storage.ts](lib/supabase-storage.ts)
   - `uploadActivityImage()`, `deleteActivityImage()`, `uploadMultipleImages()`
4. ✅ 画像アップロードコンポーネント作成
   - [components/ImageUpload.tsx](components/ImageUpload.tsx)
   - ファイル選択、プレビュー、圧縮、バリデーション
5. ✅ 投稿フォームに統合
   - [activity-log-form.tsx](components/activity-log-form.tsx) 更新
   - 画像は任意、最大3枚
6. ✅ 画像表示機能
   - [components/ActivityImages.tsx](components/ActivityImages.tsx)
   - Next.js Image最適化、遅延読み込み、クリックで拡大モーダル
   - [next.config.mjs](next.config.mjs) でSupabaseドメイン許可

### データベーススキーマ確認方法
Supabaseで実際のテーブル構造を確認：
1. Supabaseダッシュボード → Table Editor
2. または SQL Editor で `\d profiles` `\d posts` を実行

## 開発コマンド

### よく使うコマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番環境で起動
npm start

# リント
npm run lint

# 型チェック
npx tsc --noEmit
```

### Supabase型定義の更新
データベーススキーマを変更した場合は型定義を再生成：
```bash
npx supabase gen types typescript --project-id eryskzojvhzffszreycd > types/database.ts
```

**注意**: Supabase CLIのインストールが必要な場合：
```bash
npm install -g supabase
supabase login
```

### 新しいshadcn/uiコンポーネントの追加
```bash
npx shadcn@latest add [component-name]

# 例
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add dropdown-menu
```

### Git ワークフロー
```bash
# 変更状況を確認
git status

# 変更をステージング
git add .

# コミット
git commit -m "機能追加: 説明"

# GitHubにプッシュ
git push origin main

# ブランチ作成（新機能開発時）
git checkout -b feature/機能名

# ブランチをプッシュ
git push -u origin feature/機能名

# プルリクエスト作成（gh CLI使用）
gh pr create --title "機能追加" --body "説明"
```

## トラブルシューティング（追加）

### 5. Supabase接続エラー
- プロジェクトURLとAnon Keyが正しいか確認
- Supabaseプロジェクトが起動中か確認（ダッシュボードで確認）
- ネットワーク接続を確認

### 6. テーブルが見つからないエラー
- [supabase-setup.sql](supabase-setup.sql) が正しく実行されたか確認
- Supabase Table Editorでテーブルの存在を確認
- 必要に応じてSQLを再実行

### 7. 環境変数が読み込まれない
- `.env.local` ファイル名が正確か確認（スペースなど）
- 開発サーバーを再起動（変更後は必須）
- `NEXT_PUBLIC_`プレフィックスがあるか確認

## 参考リンク

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### プロジェクト固有のリソース
- [Supabaseダッシュボード](https://supabase.com/dashboard/project/eryskzojvhzffszreycd)
- [Supabase Table Editor](https://supabase.com/dashboard/project/eryskzojvhzffszreycd/editor)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/eryskzojvhzffszreycd/sql)

---

**最終更新**: 2026-02-04
**更新内容**: 画像投稿機能追加（Supabase Storage、圧縮、プレビュー、拡大モーダル）
