# Activity Log SNS - 開発メモ

**【重要】コメントなどは必ず全て日本語にしてください**

このドキュメントは、開発者とAIアシスタントのためのプロジェクト情報を記録しています。

## プロジェクト概要

Next.js 14 + Supabaseを使った活動ログSNSアプリケーション。ユーザーは毎日の活動を記録し、タイムライン形式で共有できます。

### 技術スタック
- **フロントエンド**: Next.js 14 (App Router), React, TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **画像処理**: react-easy-crop（クロップ）、browser-image-compression（圧縮）
- **アニメーション**: canvas-confetti（お祝い紙吹雪）
- **AI**: Anthropic Claude API (@anthropic-ai/sdk) - 投稿時の動的メッセージ生成
- **バックエンド**: Supabase (Auth, Database, RLS, Storage)
- **状態管理**: Server Components + Client Components

## プロジェクト構成

### ディレクトリ構造の意図

```
app/
  ├── api/
  │   ├── generate-message/  # Claude APIを使ったメッセージ生成エンドポイント
  │   └── generate-name/     # Claude APIを使ったユーモアある名前生成エンドポイント
  ├── auth/callback/      # Supabase認証後のコールバック処理
  ├── login/              # 未認証ユーザー向けログインページ
  ├── profile/edit/       # プロフィール編集ページ
  ├── users/[id]/         # ユーザーマイページ（プロフィール＋投稿一覧＋カレンダー）
  └── page.tsx            # メインページ（タイムライン、タブ切り替え対応）

components/
  ├── ui/                      # shadcn/uiの再利用可能コンポーネント
  ├── header.tsx               # [Client] ヘッダー（タイムライン・マイページ・ログアウト、モバイル用ハンバーガーメニュー）
  ├── login-form.tsx           # [Client] ログイン/登録フォーム
  ├── activity-log-form.tsx    # [Client] 活動ログ/達成ログ投稿フォーム（ログタイプ選択・画像アップロード対応）
  ├── activity-log-list.tsx    # [Client] 活動ログ一覧表示（フォローボタン・画像表示対応）
  ├── activity-calendar.tsx    # [Client] 投稿カレンダー（月間表示・日付フィルタ・達成ログ金色ハイライト対応）
  ├── comment-section.tsx      # [Client] コメント機能
  ├── follow-button.tsx        # [Client] フォロー/フォロー解除ボタン
  ├── timeline-tabs.tsx        # [Client] タイムラインタブ（全部/活動ログ/達成ログ/フォロー中）+ カテゴリフィルタ
  ├── user-profile-header.tsx  # [Server] ユーザープロフィールヘッダー
  ├── profile-edit-form.tsx    # [Client] プロフィール編集フォーム（画像アップロード・クロップ対応）
  ├── image-crop-dialog.tsx    # [Client] 画像クロップダイアログ（react-easy-crop使用）
  ├── ImageUpload.tsx          # [Client] 画像アップロードコンポーネント
  ├── ActivityImages.tsx       # [Client] 画像表示・拡大モーダル
  ├── post-actions-menu.tsx    # [Client] 投稿編集・削除メニュー（本人のみ表示）
  ├── post-edit-dialog.tsx     # [Client] 投稿編集モーダルダイアログ
  ├── encouragement-modal.tsx  # [Client] 投稿時の激励/祝福モーダル（Claude API生成メッセージ、達成時confetti）
  ├── user-items-section.tsx   # [Client] マイアイテム折りたたみセクション
  ├── user-item-card.tsx       # [Client] アイテムカード（OGPプレビュー付き）
  ├── user-item-form-dialog.tsx # [Client] アイテム追加・編集ダイアログ
  ├── user-routines-section.tsx # [Client] ルーティン折りたたみセクション
  ├── user-routine-card.tsx    # [Client] ルーティンカード（OGPプレビュー付き）
  ├── user-routine-form-dialog.tsx # [Client] ルーティン追加・編集ダイアログ
  └── routine-selector.tsx     # [Client] 投稿フォーム用ルーティン選択UI

lib/
  ├── supabase/
  │   ├── client.ts       # クライアントコンポーネント用
  │   └── server.ts       # サーバーコンポーネント/API用
  ├── supabase-storage.ts # Supabase Storage操作関数
  ├── crop-image.ts       # Canvas APIで画像を切り抜くユーティリティ
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
display_name  TEXT          -- 未設定時はAIが自動生成
avatar_url    TEXT
bio           TEXT
background_url TEXT
goal          TEXT          -- 今の目標（マイページに表示）
ai_prompt     TEXT          -- AIに覚えてほしいこと
ai_tone       TEXT          -- AIの口調・スタイル
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### テーブル: activity_logs（活動ログ/達成ログ）
```sql
id                        UUID PRIMARY KEY
user_id                   UUID (profiles参照)
category                  activity_category NOT NULL  -- 'workout' | 'study' | 'beauty'
title                     TEXT NOT NULL
content                   TEXT NOT NULL
activity_date             DATE DEFAULT CURRENT_DATE
activity_duration_minutes INTEGER          -- 活動時間（分単位）。任意入力。活動ログの場合のみ使用
image_url                 TEXT
is_image_private          BOOLEAN DEFAULT FALSE  -- 画像の公開/非公開設定
log_type                  TEXT NOT NULL DEFAULT 'activity'  -- 'activity' | 'achievement'
routine_id                UUID (user_routines参照) -- 使用したルーティン（任意）
ai_message                TEXT          -- AIが生成した励ましメッセージ（重複防止用に保存）
created_at                TIMESTAMP
updated_at                TIMESTAMP
```

#### ログタイプ
| 値 | 日本語 | アイコン | 説明 |
|---|--------|---------|------|
| `activity` | 活動ログ | 📝 | 日々の活動の記録 |
| `achievement` | 達成ログ | 🏆 | 達成したことの記録 |

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

#### テーブル: follows（フォロー関係）
```sql
id            UUID PRIMARY KEY
follower_id   UUID (profiles参照) NOT NULL
following_id  UUID (profiles参照) NOT NULL
created_at    TIMESTAMP
UNIQUE(follower_id, following_id)  -- 同じユーザーを複数回フォロー不可
CHECK(follower_id != following_id) -- 自分自身をフォロー不可
```

#### テーブル: user_items（マイアイテム）
```sql
id            UUID PRIMARY KEY
user_id       UUID (profiles参照) NOT NULL
product_name  TEXT NOT NULL          -- 商品名
product_url   TEXT                   -- 商品URL（任意）
usage_method  TEXT                   -- 使用方法・頻度
started_at    TIMESTAMP DEFAULT NOW()  -- 利用開始日（自動設定、編集不可）
ended_at      TIMESTAMP              -- 利用停止日（NULL=利用中、設定後は編集不可）
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

**RLS**: 全員が閲覧可能、本人のみ作成/更新/削除可能

**機能**:
- マイページに折りたたみ式セクションとして表示
- 登録時に自動で「利用開始日」が設定される
- 「利用停止」アクションで停止日を記録（一度設定すると変更不可）
- 商品URLがある場合はOGPプレビューを自動表示
- 利用中アイテムが優先表示、停止済みアイテムは下に表示

#### テーブル: user_routines（ルーティン）
```sql
id                UUID PRIMARY KEY
user_id           UUID (profiles参照) NOT NULL
title             TEXT NOT NULL          -- タイトル（例: 「朝のランニング」）
category          activity_category NOT NULL  -- カテゴリ
duration_minutes  INTEGER                -- 所要時間（分）
content           TEXT                   -- 内容（URLリンク化対象）
started_at        TIMESTAMP DEFAULT NOW()  -- 開始日（自動設定、編集不可）
ended_at          TIMESTAMP              -- 終了日（NULL=実施中、設定後は編集不可）
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

**RLS**: 全員が閲覧可能、本人のみ作成/更新/削除可能

**機能**:
- マイページに折りたたみ式セクションとして表示
- 投稿フォームでルーティンを選択すると、カテゴリ・所要時間・内容が自動入力される
- ルーティンを使った投稿には「🔄 ルーティン名」ラベルが表示される（indigo色）
- URLが含まれる場合はOGPプレビューを自動表示
- 登録時に「開始日」が自動設定（編集不可）
- 「終了」で終了日を記録（一度設定すると変更不可）
- 終了したルーティンは投稿フォームで選択不可
- 実施中ルーティンが優先表示、終了済みは「過去のルーティン」折りたたみ内に表示

#### カテゴリ（ENUM型）
| 値 | 日本語 | アイコン | 色 |
|---|--------|---------|-----|
| `workout` | 運動 | 💪 | オレンジ |
| `study` | 勉強 | 📚 | ブルー |
| `beauty` | 美容 | ✨ | ピンク |
| `meal` | 食事 | 🍽️ | グリーン |
| `work` | 仕事 | 💼 | パープル |
| `dev` | 開発 | 💻 | ティール |

#### RLS (Row Level Security)
- **profiles**: 全員が閲覧可能、本人のみ更新可能
- **activity_logs**: 全員が閲覧可能、本人のみ作成/更新/削除可能
- **likes**: 全員が閲覧可能、認証ユーザーが作成可能、本人のみ削除可能
- **comments**: 全員が閲覧可能、認証ユーザーが作成可能、本人のみ更新/削除可能
- **follows**: 全員が閲覧可能、本人のみフォロー作成/削除可能
- **user_items**: 全員が閲覧可能、本人のみ作成/更新/削除可能
- **user_routines**: 全員が閲覧可能、本人のみ作成/更新/削除可能

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
| INSERT | 認証ユーザー | 自分のフォルダ（`{user_id}/*` または `profiles/{user_id}/*`） |
| SELECT | 全員 | - |
| DELETE | 認証ユーザー | 自分のフォルダのファイルのみ |
| UPDATE | 認証ユーザー | 自分のフォルダのファイルのみ |

**注意**: プロフィール画像は `profiles/{userId}/{type}-{timestamp}-{random}.{ext}` パスに保存される。活動ログ画像は `{userId}/{filename}` パスに保存される。

#### 画像投稿機能

**関連ファイル:**
- [lib/supabase-storage.ts](lib/supabase-storage.ts) - Storage操作関数
- [types/storage.ts](types/storage.ts) - 型定義・定数
- [components/ImageUpload.tsx](components/ImageUpload.tsx) - アップロードUI
- [components/ActivityImages.tsx](components/ActivityImages.tsx) - 画像表示・モーダル

**機能:**
- 画像形式: JPEG, PNG, GIF, WebP
- 最大ファイルサイズ: 5MB（活動ログ画像）/ 制限なし（プロフィール画像、圧縮で対応）
- 最大枚数: 3枚/投稿
- クライアント側圧縮: browser-image-compression使用（1MB以下、1920px以下）
- 画像URLはJSON配列として `activity_logs.image_url` に保存
- **公開/非公開設定**: 画像添付時に公開（🌐）または非公開（🔒）を選択可能
  - 非公開画像は他のユーザーには「🔒 非公開の画像がN枚あります」と表示
  - 投稿者本人には画像が表示され、「非公開（他のユーザーには表示されません）」のインジケーター表示

#### プロフィール画像機能

**関連ファイル:**
- [lib/supabase-storage.ts](lib/supabase-storage.ts) - `uploadProfileImage()` 関数
- [components/profile-edit-form.tsx](components/profile-edit-form.tsx) - プロフィール編集フォーム
- [components/image-crop-dialog.tsx](components/image-crop-dialog.tsx) - クロップダイアログ
- [lib/crop-image.ts](lib/crop-image.ts) - Canvas APIで画像切り抜きユーティリティ

**機能:**
- アイコン画像（avatar_url）: 1:1アスペクト比でクロップ、円形表示
- 背景画像（background_url）: 40:9アスペクト比でクロップ（表示領域に合致）
- react-easy-cropによるドラッグ＆ズームでのクロップ
- 切り抜き後にbrowser-image-compressionで圧縮（1MB以下）
- 画像変更時は旧画像を自動削除

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
SUPABASE_SERVICE_ROLE_KEY=    # アカウント削除機能に必要（サーバーサイド専用）
```

**注意**:
- `NEXT_PUBLIC_`プレフィックスはクライアント側でも使用可能にする
- `SUPABASE_SERVICE_ROLE_KEY`はSupabaseダッシュボードのSettings > API > Project API keysから取得

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
1. ~~**プロフィール編集機能**~~ ✅ 実装済み
   - `/profile/edit`ページ作成
   - アカウント名・自己紹介文・アイコン画像・背景画像の設定
   - 画像クロップ（切り抜き）機能付き
   - メールアドレスの非公開化

2. ~~**投稿の編集・削除機能**~~ ✅ 実装済み
   - 投稿カードに「⋯」メニューボタン追加（本人のみ表示）
   - 編集: カテゴリ・内容・画像の変更、「（更新）」表示
   - 削除: 確認ダイアログ付き、コメント・いいねも一緒に削除

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

6. ~~**無限スクロール**~~ ✅ 実装済み
   - Intersection Observer使用
   - カーソルベースページネーション
   - パフォーマンス最適化（React.memo、楽観的更新）

### 優先度: 低
7. **リアルタイム更新**
   - Supabase Realtime使用
   - 新規投稿の自動表示

8. ~~**フォロー機能**~~ ✅ 実装済み
   - `follows`テーブル追加
   - フォロー/フォロー解除ボタン
   - タイムラインタブ切り替え（全投稿/フォロー中）
   - ユーザーマイページ（`/users/[id]`）
   - フォロワー数・フォロー中数の表示

9. **検索機能**
   - 投稿の全文検索
   - ユーザー検索

## データベーススキーマ拡張案

### follows テーブル ✅ 実装済み
- セットアップファイル: [supabase-follows-setup.sql](supabase-follows-setup.sql)
- マイグレーション: `supabase/migrations/20260204225531_add_follows_table.sql`

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

### Vercelデプロイ ✅ 完了
- **本番URL**: https://activity-log-sns.vercel.app （公開アクセス可能）
- **デプロイ日**: 2026-02-06
- **自動デプロイ**: GitHub mainブランチへのpush時に自動デプロイ

#### 手動デプロイコマンド
```bash
# プレビューデプロイ
vercel

# 本番デプロイ
vercel --prod
```

#### 環境変数（Vercel側で設定済み）
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Supabase認証URL設定
Supabaseダッシュボード > Authentication > URL Configuration で設定:
- **Site URL**: `https://activity-log-sns.vercel.app`
- **Redirect URLs**:
  - `https://activity-log-sns.vercel.app/auth/callback` （本番用）
  - `http://localhost:3000/auth/callback` （ローカル開発用）

### デプロイチェックリスト
- [x] 本番環境用の環境変数を設定
- [x] ビルドが成功することを確認（`npm run build`）
- [x] Supabase RLSが有効化されているか確認
- [x] `.env.local`が`.gitignore`に含まれているか確認
- [ ] エラーバウンダリーの実装（推奨）

### その他のデプロイオプション
- **Netlify**: 同様にGitHub連携可能
- **AWS Amplify**: AWSエコシステム使用時
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
7. ✅ GitHubプッシュ完了
   - コミットID: `9e53a33`
   - 21ファイル変更（1,418行追加）

### フォロー機能・マイページ・タイムライン追加 (2026-02-05)
1. ✅ データベース拡張
   - `follows` テーブル追加（RLSポリシー・インデックス含む）
   - 使用ファイル: [supabase-follows-setup.sql](supabase-follows-setup.sql)
   - マイグレーション: `supabase db push` で適用済み
2. ✅ ユーザーマイページ作成
   - [app/users/[id]/page.tsx](app/users/[id]/page.tsx)
   - [components/user-profile-header.tsx](components/user-profile-header.tsx)
   - プロフィール情報、投稿一覧、フォロワー数・フォロー中数表示
3. ✅ フォロー機能実装
   - [components/follow-button.tsx](components/follow-button.tsx) - フォロー/フォロー解除ボタン
   - 投稿カード・マイページ両方にフォローボタン配置
   - 楽観的UI更新（LikeButtonと同パターン）
4. ✅ タイムラインタブ切り替え
   - [components/timeline-tabs.tsx](components/timeline-tabs.tsx) - 「全ての投稿」/「フォロー中」タブ
   - [app/page.tsx](app/page.tsx) - `?tab=following` パラメータによるフィルタリング
5. ✅ ナビゲーション改善
   - ヘッダーに「タイムライン」「マイページ」ボタン追加
   - 投稿カードのユーザー名・アバターをクリックでマイページへ遷移
6. ✅ 型定義更新
   - [types/database.ts](types/database.ts) - `follows` テーブル型追加
   - [types/index.ts](types/index.ts) - `Follow` 型エクスポート追加

### マイページ投稿カレンダー追加 (2026-02-06)
1. ✅ 投稿カレンダーコンポーネント作成
   - [components/activity-calendar.tsx](components/activity-calendar.tsx) - Client Component
   - 月間グリッドカレンダー（日〜土の7列）
   - 前月/次月ナビゲーション（lucide-react ChevronLeft/ChevronRight）
   - 投稿がある日を青い背景・枠線でハイライト表示
   - カテゴリ別の色付きドット表示（筋トレ=オレンジ、勉強=ブルー、美容=ピンク）
   - 今日の日付は太字＋枠線で強調
   - 外部ライブラリ不使用（Tailwind CSS + shadcn/ui Cardのみ）
2. ✅ 日付フィルタリング機能
   - [app/users/[id]/page.tsx](app/users/[id]/page.tsx) - `searchParams.date` による投稿フィルタ
   - カレンダーの日付クリックで `?date=YYYY-MM-DD` をURLに追加
   - 同じ日付を再クリック or ✕ボタンでフィルタ解除
   - カレンダー用の全投稿日・カテゴリは軽量クエリで別途取得（50件制限の影響を受けない）
3. ✅ 配置: UserProfileHeaderとActivityLogListの間

### 投稿フォーム改善 (2026-02-06)
1. ✅ タイトル欄の削除
   - [components/activity-log-form.tsx](components/activity-log-form.tsx) - `title`のstate・入力欄を削除
   - [components/activity-log-list.tsx](components/activity-log-list.tsx) - タイトル表示（`<h3>`）を削除
   - DBのNOT NULL制約維持のため `title: ''` を送信
2. ✅ 活動日の入力を「今日」「昨日」の選択リストに変更
   - [components/activity-log-form.tsx](components/activity-log-form.tsx) - `<input type="date">` → `<select>` に変更
   - 選択肢: 「今日（YYYY/MM/DD）」「昨日（YYYY/MM/DD）」
   - `toISOString()`（UTC）→ ローカルタイムゾーン対応の`toLocalDateString()`ヘルパーで日付ずれを修正

### プロフィール編集・画像クロップ機能追加 (2026-02-05)
1. ✅ データベース拡張
   - `profiles`テーブルに`background_url`カラム追加
   - マイグレーション: `supabase/migrations/20260205053201_add_background_url_to_profiles.sql`
   - Storageポリシー更新（`profiles/{userId}/*`パスを許可）
   - マイグレーション: `supabase/migrations/20260205055335_add_profile_images_storage_policy.sql`
2. ✅ パッケージインストール
   - `react-easy-crop` - 画像クロップUI
3. ✅ プロフィール編集ページ作成
   - [app/profile/edit/page.tsx](app/profile/edit/page.tsx) - サーバーコンポーネント
   - [components/profile-edit-form.tsx](components/profile-edit-form.tsx) - 編集フォーム
   - アカウント名・自己紹介文・アイコン画像・背景画像の設定
4. ✅ 画像クロップ機能実装
   - [components/image-crop-dialog.tsx](components/image-crop-dialog.tsx) - クロップダイアログ
   - [lib/crop-image.ts](lib/crop-image.ts) - Canvas APIユーティリティ
   - アイコン: 1:1、背景: 40:9 のアスペクト比
5. ✅ ユーザープロフィールヘッダー改修
   - [components/user-profile-header.tsx](components/user-profile-header.tsx)
   - 背景画像表示、実際のアバター画像表示対応
   - プロフィール編集ボタン配置
6. ✅ メールアドレス非公開化
   - ヘッダーにメールアドレスの代わりにアカウント名を表示
7. ✅ タイムラインのアバター画像表示修正
   - [components/activity-log-list.tsx](components/activity-log-list.tsx)
   - `avatar_url`がある場合は実画像を表示

### Vercelデプロイ (2026-02-06)
1. ✅ Vercel CLIインストール
   - `npm i -g vercel`
2. ✅ Vercelアカウント作成・ログイン
   - `vercel login` でGitHub認証
3. ✅ プロジェクト初期デプロイ
   - `vercel` コマンドでプロジェクトリンク・初回デプロイ
4. ✅ 環境変数設定
   - `vercel env add NEXT_PUBLIC_SUPABASE_URL`
   - `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. ✅ 本番デプロイ
   - `vercel --prod` で本番環境にデプロイ
   - 本番URL: https://activity-log-sns.vercel.app
6. ✅ GitHub自動デプロイ連携
   - Vercelダッシュボード > Settings > Git でGitHub連携設定
   - mainブランチへのpushで自動デプロイ
7. ✅ Supabase認証URL設定
   - Site URL: `https://activity-log-sns.vercel.app`
   - Redirect URLs: 本番用・ローカル開発用の両方を登録

### モバイル用ハンバーガーメニュー追加 (2026-02-06)
1. ✅ ヘッダーのレスポンシブ対応
   - [components/header.tsx](components/header.tsx) - ハンバーガーメニュー実装
   - デスクトップ（640px以上）: 従来通りの横並びメニュー
   - モバイル（640px未満）: ハンバーガーアイコンをタップでメニュー展開
2. ✅ 実装詳細
   - `useState`でメニュー開閉状態管理
   - lucide-react `Menu`/`X` アイコン使用
   - Tailwindの `sm:hidden`/`hidden sm:flex` でレスポンシブ切り替え
   - メニュー項目クリック時に自動でメニューを閉じる

### 投稿の編集・削除機能追加 (2026-02-06)
1. ✅ 投稿アクションメニュー作成
   - [components/post-actions-menu.tsx](components/post-actions-menu.tsx) - 「⋯」メニューコンポーネント
   - 投稿オーナーのみ表示（編集・削除ボタン）
2. ✅ 投稿編集ダイアログ作成
   - [components/post-edit-dialog.tsx](components/post-edit-dialog.tsx) - 編集モーダル
   - カテゴリ・内容・画像の変更対応
   - 既存画像の削除・新規画像の追加
3. ✅ 投稿一覧への統合
   - [components/activity-log-list.tsx](components/activity-log-list.tsx) - 編集・削除機能統合
   - 日時表示の改善: 活動日、投稿日時、更新日時を3行で表示
   - 1行目: 活動日（2026年2月6日）
   - 2行目: `投稿 yyyy/MM/dd HH:mm`
   - 3行目: `更新 yyyy/MM/dd HH:mm`（編集済みの場合のみ）
4. ✅ Storage関数エクスポート
   - [lib/supabase-storage.ts](lib/supabase-storage.ts) - `extractPathFromUrl()`をエクスポート
5. ✅ 削除時の動作
   - 確認ダイアログ表示
   - CASCADE: 紐づくコメント・いいねも自動削除
   - Storage: 添付画像も削除

### モバイルレイアウト修正 (2026-02-06)
1. ✅ 投稿一覧のカテゴリバッジ折り返し修正
   - [components/activity-log-list.tsx](components/activity-log-list.tsx) - カテゴリバッジにスタイル追加
   - `whitespace-nowrap` - テキストの折り返しを防止
   - `shrink-0` - フレックスボックス内での縮小を防止
2. ✅ 投稿カードのオーバーフロー修正
   - 左側コンテナ: `min-w-0 flex-1` で縮小可能に
   - 右側コンテナ: `shrink-0` で縮小しない
   - 日時表示: `truncate` で長い場合は省略
2. ✅ 投稿フォームのカテゴリボタン折り返し修正
   - [components/activity-log-form.tsx](components/activity-log-form.tsx) - カテゴリ選択ボタンにスタイル追加
   - `whitespace-nowrap` - テキストの折り返しを防止
   - `px-2 sm:px-3` - モバイルでパディングを縮小
   - `text-base sm:text-lg` / `text-xs sm:text-sm` - モバイルでフォントサイズを縮小
   - 修正前: 「筋トレ」が「筋ト」「レ」に分かれて表示される問題

### 達成ログ機能・2段階フィルタリング追加 (2026-02-06)
1. ✅ データベース拡張
   - `activity_logs`テーブルに`log_type`カラム追加（'activity' | 'achievement'）
   - マイグレーション: `supabase/migrations/20260206090000_add_log_type_to_activity_logs.sql`
   - インデックス追加（`log_type`, `log_type + created_at`）
2. ✅ 型定義更新
   - [types/database.ts](types/database.ts) - `LogType`型、`LOG_TYPE_LABELS`追加
3. ✅ 投稿フォーム拡張
   - [components/activity-log-form.tsx](components/activity-log-form.tsx)
   - ログタイプ選択UI追加（📝活動ログ / 🏆達成ログ）
   - 達成ログ選択時: 「活動日」→「達成日」、プレースホルダー変更
4. ✅ タイムライン2段階フィルタリング
   - [components/timeline-tabs.tsx](components/timeline-tabs.tsx) - 4タブ + カテゴリフィルタ
   - 第1段階（タブ）: 全部 / 活動ログ / 達成ログ / フォロー中
   - 第2段階（ボタン）: 全て / 💪筋トレ / 📚勉強 / ✨美容
   - URLパラメータ: `?tab=activity&category=workout`
5. ✅ 投稿リスト更新
   - [components/activity-log-list.tsx](components/activity-log-list.tsx)
   - 達成ログの視覚的区別（🏆バッジ、金色グラデーション背景）
   - タブ・カテゴリ別の空状態メッセージ

### マイページフィルター・カレンダー金色ハイライト追加 (2026-02-06)
1. ✅ マイページ2段階フィルタリング
   - [app/users/[id]/page.tsx](app/users/[id]/page.tsx) - タブ・カテゴリフィルタ追加
   - [components/timeline-tabs.tsx](components/timeline-tabs.tsx) - `showFollowingTab` props追加
   - マイページ: 3タブ（全部 / 活動ログ / 達成ログ）※フォロー中なし
   - メインページ: 4タブ（従来通り）
2. ✅ カレンダー達成ログ金色ハイライト
   - [components/activity-calendar.tsx](components/activity-calendar.tsx) - 型定義・スタイル変更
   - `activityDateMap` 型: `Record<string, { categories: string[], hasAchievement: boolean }>`
   - 達成ログがある日: 金色ハイライト（`bg-amber-50`, `ring-amber-200`）
   - 活動ログのみの日: 青色ハイライト（従来通り）

### Claude APIによる動的メッセージ生成 (2026-02-06)
1. ✅ パッケージインストール
   - `@anthropic-ai/sdk` - Anthropic Claude API SDK
   - `canvas-confetti` - 紙吹雪アニメーションライブラリ
2. ✅ APIルート作成
   - [app/api/generate-message/route.ts](app/api/generate-message/route.ts)
   - モデル: `claude-3-haiku-20240307`（高速レスポンス用）
   - ユーザーの過去の活動履歴を元にパーソナライズされたメッセージを生成
   - 連続活動日数（streak）、活動/達成回数をプロンプトに含める
3. ✅ 激励/祝福モーダルコンポーネント
   - [components/encouragement-modal.tsx](components/encouragement-modal.tsx)
   - 活動ログ: 「💪 お疲れさまです！」+ 動的メッセージ
   - 達成ログ: 「🏆 達成おめでとう！」+ 動的メッセージ + 紙吹雪アニメーション
   - メッセージ生成中は「メッセージを生成中...」表示
   - API失敗時はフォールバックメッセージを表示
4. ✅ 環境変数
   - `ANTHROPIC_API_KEY` - Claude API認証キー（.env.local、サーバーサイド専用）
   - 本番環境: Vercel Environment Variablesに設定が必要

### AIパーソナライゼーション機能追加 (2026-02-07)
1. ✅ ユーザー別AI設定
   - `profiles`テーブルに`ai_prompt`（AIに覚えてほしいこと）、`ai_tone`（口調・スタイル）カラム追加
   - マイグレーション: `supabase/migrations/20260207032732_add_ai_settings_to_profiles.sql`
   - [components/profile-edit-form.tsx](components/profile-edit-form.tsx) - 設定UI追加
2. ✅ 目標フィールド追加
   - `profiles`テーブルに`goal`カラム追加
   - マイグレーション: `supabase/migrations/20260207033957_add_goal_to_profiles.sql`
   - [components/user-profile-header.tsx](components/user-profile-header.tsx) - 🎯目標表示
3. ✅ @ユーザーID表示の削除
   - プライバシー対策（メールアドレスが推測可能なため）
   - [components/user-profile-header.tsx](components/user-profile-header.tsx) からusername表示を削除
4. ✅ AI自動名前生成
   - [app/api/generate-name/route.ts](app/api/generate-name/route.ts) - 名前生成エンドポイント
   - display_name未設定時、プロフィール作成時にAIがユーモアある名前を自動生成
   - 例: 「がんばる山田」「継続の達人」「朝活マスター」
5. ✅ AIメッセージ保存・重複防止
   - `activity_logs`テーブルに`ai_message`カラム追加
   - マイグレーション: `supabase/migrations/20260207130416_add_ai_message_to_activity_logs.sql`
   - 生成されたメッセージをログに保存、次回生成時に参照して重複を防ぐ
   - プロンプトに「過去のメッセージと同じ表現を繰り返さない」指示を追加

### 画像公開/非公開機能追加 (2026-02-07)
1. ✅ データベース拡張
   - `activity_logs`テーブルに`is_image_private`カラム追加（BOOLEAN DEFAULT FALSE）
   - マイグレーション: `supabase/migrations/20260207150100_add_is_image_private_to_activity_logs.sql`
   - 既存レコードのnull値修正: `supabase/migrations/20260207150200_fix_is_image_private_null.sql`
2. ✅ 投稿フォーム拡張
   - [components/activity-log-form.tsx](components/activity-log-form.tsx) - 画像添付時に公開/非公開選択UI追加
   - 「🌐 公開」「🔒 非公開」ボタンで切り替え
3. ✅ 画像表示コンポーネント更新
   - [components/ActivityImages.tsx](components/ActivityImages.tsx) - 非公開画像の表示制御
   - 他のユーザー: 「🔒 非公開の画像がN枚あります」と表示
   - 投稿者本人: 画像表示 + 「非公開（他のユーザーには表示されません）」インジケーター
4. ✅ 投稿編集ダイアログ更新
   - [components/post-edit-dialog.tsx](components/post-edit-dialog.tsx) - 編集時にも公開/非公開変更可能
5. ✅ 型定義更新
   - [types/database.ts](types/database.ts) - `is_image_private`フィールド追加

### URLリンク化・OGPプレビュー機能 (2026-02-07)
1. ✅ URLリンク化コンポーネント
   - [components/LinkifiedText.tsx](components/LinkifiedText.tsx) - 投稿内のURLを自動リンク化
   - [lib/url-utils.ts](lib/url-utils.ts) - URL抽出ユーティリティ
2. ✅ OGPプレビューコンポーネント
   - [components/OgpPreviewCard.tsx](components/OgpPreviewCard.tsx) - OGPカード表示
   - [components/OgpPreviewList.tsx](components/OgpPreviewList.tsx) - 複数URL対応のリスト
   - [app/api/og-preview/route.ts](app/api/og-preview/route.ts) - OGPメタデータ取得API
3. ✅ OGPキャッシュテーブル
   - `ogp_cache`テーブル追加（URL、タイトル、説明、画像URL、有効期限管理）
   - マイグレーション: `supabase/migrations/20260207160000_add_ogp_cache_table.sql`
   - DELETEポリシー追加: `supabase/migrations/20260207190000_fix_ogp_cache_delete_policy.sql`
4. ✅ 投稿・コメントへの統合
   - [components/activity-log-list.tsx](components/activity-log-list.tsx) - 投稿内容にOGPプレビュー表示
   - [components/comment-section.tsx](components/comment-section.tsx) - コメント内容にOGPプレビュー表示
5. ✅ OGPテキストデコード機能
   - HTMLエンティティ（`&#12354;` や `&#x3042;`）を通常の文字にデコード
   - URLエンコード（`%E3%81%82`）も対応
   - `decodeHtmlEntities()` + `decodeOgpText()` 関数で実装
6. ✅ OGPキャッシュ管理スクリプト
   - [scripts/delete-ogp-cache.ts](scripts/delete-ogp-cache.ts) - キャッシュ削除
   - [scripts/list-ogp-cache.ts](scripts/list-ogp-cache.ts) - キャッシュ一覧表示
   - 実行: `npx tsx scripts/delete-ogp-cache.ts "パターン"`
7. ⚠️ 制限事項
   - Cloudflare保護のあるサイト（iHerbなど）はOGPプレビューが表示されない
   - サーバーサイドからのフェッチがブロックされるため、フォールバックリンク表示になる

### いいねユーザー一覧表示機能 (2026-02-07)
1. ✅ データ取得拡張
   - [app/page.tsx](app/page.tsx) - likesクエリにプロフィール情報を追加
   - 取得データ: `id`, `user_id`, `profiles { id, username, display_name, avatar_url }`
2. ✅ いいねユーザー一覧ダイアログ
   - [components/activity-log-list.tsx](components/activity-log-list.tsx) - LikeButton拡張
   - いいね数（数字部分）をクリックでダイアログを開く
   - ユーザーのアバター・表示名・プロフィールへのリンクを表示
   - いいねが0件の場合はクリック不可
3. ✅ UI詳細
   - ハートアイコンクリック → いいね/いいね解除（従来通り）
   - 数字クリック → いいねしたユーザー一覧ダイアログ表示
   - ダイアログ内でユーザーをクリック → プロフィールページに遷移

### 更新日時表示の修正 (2026-02-07)
1. ✅ 問題修正
   - AIメッセージ保存時の`update`で`updated_at`が更新されてしまう問題を修正
   - [components/activity-log-list.tsx](components/activity-log-list.tsx) - 更新日時表示の条件を変更
   - `updated_at`と`created_at`の差が10秒以内の場合は「更新」表示をスキップ
   - これによりAIメッセージ自動保存では「更新」が表示されず、ユーザー編集時のみ表示

### モバイル表示のラベル配置修正 (2026-02-07)
1. ✅ レイアウト改善
   - [components/activity-log-list.tsx](components/activity-log-list.tsx) - 投稿カードのラベル配置を変更
   - 達成ラベル（🏆達成）とカテゴリラベル（💪筋トレ等）をアカウント名の下の行に移動
   - モバイルでアカウント名が見切れる問題を解消
   - 修正後レイアウト:
     - 1行目: アカウント名 + フォローボタン + ⋯メニュー
     - 2行目: 達成ラベル + カテゴリラベル
     - 3行目: 日付情報

### 投稿後モーダルの絵文字ランダム化 (2026-02-07)
1. ✅ 絵文字のバリエーション追加
   - [components/encouragement-modal.tsx](components/encouragement-modal.tsx) - 絵文字をランダム選択に変更
   - 達成ログタイトル: 🏆, 🎊, 👑, 🥇, ⭐ からランダム
   - 達成ログ本文: 🎉, 🎊, ✨, 🌟, 💫, 🥳 からランダム
   - 活動ログタイトル: 💪, 🔥, ⚡, 🌈, 🚀 からランダム
   - 活動ログ本文: ✨, 🌟, 💫, 🙌, 👏, 🎯 からランダム
   - モーダルが開くたびに新しい絵文字が選ばれる

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
- [Vercelダッシュボード](https://vercel.com/nagi-whorays-projects/activity-log-sns)
- [本番サイト](https://activity-log-sns.vercel.app)
- [Supabaseダッシュボード](https://supabase.com/dashboard/project/eryskzojvhzffszreycd)
- [Supabase Table Editor](https://supabase.com/dashboard/project/eryskzojvhzffszreycd/editor)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/eryskzojvhzffszreycd/sql)

### カテゴリ追加: 食事・仕事・開発 (2026-02-07)
1. ✅ 新カテゴリ追加
   - 🍽️ 食事 (`meal`) - 緑系
   - 💼 仕事 (`work`) - 紫系
   - 💻 開発 (`dev`) - ティール系
2. ✅ 型定義更新
   - [types/database.ts](types/database.ts) - `ActivityCategory`型、`ACTIVITY_CATEGORY_LABELS`
3. ✅ DBマイグレーション
   - `supabase/migrations/20260207075734_add_category_meal_work_dev.sql`
   - ENUM型に3つの値を追加
4. ✅ UIコンポーネント更新
   - [components/activity-log-form.tsx](components/activity-log-form.tsx) - 投稿フォーム
   - [components/post-edit-dialog.tsx](components/post-edit-dialog.tsx) - 編集ダイアログ
   - [components/activity-log-list.tsx](components/activity-log-list.tsx) - 投稿表示スタイル
   - [components/activity-calendar.tsx](components/activity-calendar.tsx) - カレンダー色
   - [components/timeline-tabs.tsx](components/timeline-tabs.tsx) - フィルタータブ
   - [app/api/generate-message/route.ts](app/api/generate-message/route.ts) - AIメッセージ生成

### 活動時間入力機能追加 (2026-02-07)
1. ✅ データベース拡張
   - `activity_logs`テーブルに`activity_duration_minutes`カラム追加（INTEGER、NULL許容）
   - マイグレーション: `supabase/migrations/20260207173250_add_activity_duration_minutes.sql`
2. ✅ 型定義更新
   - [types/database.ts](types/database.ts) - `activity_duration_minutes`フィールド追加
3. ✅ 投稿フォーム拡張
   - [components/activity-log-form.tsx](components/activity-log-form.tsx) - 活動時間入力フィールド追加
   - 活動ログの場合のみ表示（達成ログでは非表示）
   - 活動日の下に配置、入力は任意
4. ✅ AIメッセージ生成連携
   - [app/api/generate-message/route.ts](app/api/generate-message/route.ts) - 活動時間をプロンプトに含める
   - 例: 「活動時間: 30分」

### マイアイテム機能追加 (2026-02-07)
1. ✅ データベース拡張
   - `user_items`テーブル追加（商品名、URL、使用方法、利用開始日、利用停止日）
   - マイグレーション: `supabase/migrations/20260207200000_add_user_items_table.sql`
   - RLSポリシー: 全員閲覧可、本人のみ作成/更新/削除可
2. ✅ 型定義更新
   - [types/database.ts](types/database.ts) - `UserItem`, `UserItemInsert`, `UserItemUpdate`型追加
3. ✅ コンポーネント作成
   - [components/user-items-section.tsx](components/user-items-section.tsx) - 折りたたみ式セクション
   - [components/user-item-card.tsx](components/user-item-card.tsx) - アイテムカード（OGPプレビュー付き）
   - [components/user-item-form-dialog.tsx](components/user-item-form-dialog.tsx) - 追加・編集ダイアログ
4. ✅ マイページ統合
   - [app/users/[id]/page.tsx](app/users/[id]/page.tsx) - UserProfileHeaderの下に配置
5. ✅ 機能詳細
   - 商品名（必須）、商品URL（任意）、使用方法（任意）を登録
   - 登録時に「利用開始日」が自動設定（編集不可）
   - 「利用停止」で停止日を記録（一度設定すると変更不可）
   - 商品URLがある場合はOGPメタデータを取得してプレビュー表示
   - 利用中アイテムが優先表示、停止済みは下に表示
   - 折りたたみ式でデフォルトは閉じた状態

### 無限スクロール・パフォーマンス最適化 (2026-02-07)
1. ✅ ページネーションAPI作成
   - [app/api/activity-logs/route.ts](app/api/activity-logs/route.ts) - カーソルベースのページネーションAPI
   - タブ（all/following/activity/achievement）とカテゴリのフィルタリング対応
   - ユーザーID・日付によるフィルタリング対応（プロフィールページ用）
2. ✅ 無限スクロールコンポーネント作成
   - [components/activity-log-list-client.tsx](components/activity-log-list-client.tsx) - Intersection Observer使用
   - 画面下部到達時に自動で追加読み込み
   - ローディングインジケータ・終端メッセージ表示
3. ✅ ActivityLogCardのメモ化
   - [components/activity-log-card.tsx](components/activity-log-card.tsx) - React.memoでパフォーマンス最適化
   - カスタム比較関数でlikes/comments変更時のみ再レンダリング
4. ✅ 楽観的更新の実装
   - いいねボタンで`router.refresh()`を削除
   - ローカルステートのみ更新でUI即時反映
5. ✅ カレンダーデータの最適化
   - 初回読み込みは過去12ヶ月分のみ取得
   - [app/api/calendar-data/route.ts](app/api/calendar-data/route.ts) - 全期間データ取得API
   - 12ヶ月より前の月に移動時、全期間データを動的取得
6. ✅ 型定義追加
   - [types/database.ts](types/database.ts) - `PaginatedResponse`, `ActivityLogFilters`型追加
7. ✅ ページ修正
   - [app/page.tsx](app/page.tsx) - 無限スクロール対応
   - [app/users/[id]/page.tsx](app/users/[id]/page.tsx) - 無限スクロール + カレンダー最適化
8. ✅ 1ページあたり件数: 20件（PAGE_SIZE定数）

### ルーティン機能追加 (2026-02-07)
1. ✅ データベース拡張
   - `user_routines`テーブル追加（タイトル、カテゴリ、所要時間、内容）
   - `activity_logs`テーブルに`routine_id`カラム追加
   - マイグレーション: `supabase/migrations/20260207210000_add_user_routines_table.sql`
   - RLSポリシー: 全員閲覧可、本人のみ作成/更新/削除可
2. ✅ 型定義更新
   - [types/database.ts](types/database.ts) - `UserRoutine`, `UserRoutineInsert`, `UserRoutineUpdate`型追加
   - `ActivityLogWithAll`型に`routine`フィールド追加
3. ✅ コンポーネント作成
   - [components/user-routines-section.tsx](components/user-routines-section.tsx) - 折りたたみ式セクション
   - [components/user-routine-card.tsx](components/user-routine-card.tsx) - ルーティンカード（OGPプレビュー付き）
   - [components/user-routine-form-dialog.tsx](components/user-routine-form-dialog.tsx) - 追加・編集ダイアログ
   - [components/routine-selector.tsx](components/routine-selector.tsx) - 投稿フォーム用選択UI
4. ✅ 投稿フォーム統合
   - [components/activity-log-form.tsx](components/activity-log-form.tsx) - ルーティン選択機能追加
   - ルーティン選択時にカテゴリ・所要時間・内容を自動入力（常に上書き）
5. ✅ 投稿表示更新
   - [components/activity-log-card.tsx](components/activity-log-card.tsx) - ルーティンラベル表示（🔄アイコン、indigo色）
   - [components/activity-log-list.tsx](components/activity-log-list.tsx) - ルーティンラベル表示
6. ✅ マイページ統合
   - [app/users/[id]/page.tsx](app/users/[id]/page.tsx) - ルーティンセクション追加
7. ✅ API更新
   - [app/api/activity-logs/route.ts](app/api/activity-logs/route.ts) - ルーティン情報をJOIN

### 活動時間表示機能追加 (2026-02-08)
1. ✅ 投稿カードに活動時間を表示
   - [components/activity-log-card.tsx](components/activity-log-card.tsx) - 活動時間表示追加
   - 活動日の隣に「⏱️ X時間Y分」形式で表示
   - 活動時間が未入力（null）の投稿では非表示
2. ✅ 型定義更新
   - `ActivityLogData`インターフェースに`activity_duration_minutes`フィールド追加
3. ✅ フォーマット関数
   - `formatDuration(minutes)` - 分を「X時間Y分」形式に変換
   - 例: 90分 → 「1時間30分」、60分 → 「1時間」、30分 → 「30分」

### ルーティン開始日/終了日・過去アイテム折りたたみ機能追加 (2026-02-08)
1. ✅ データベース拡張
   - `user_routines`テーブルに`started_at`、`ended_at`カラム追加
   - マイグレーション: `supabase/migrations/20260208000000_add_routine_dates.sql`
   - 既存ルーティンの`started_at`は`created_at`の値で初期化
2. ✅ 型定義更新
   - [types/database.ts](types/database.ts) - `started_at`, `ended_at`フィールド追加
3. ✅ ルーティンカード機能拡張
   - [components/user-routine-card.tsx](components/user-routine-card.tsx) - 「終了」ボタン追加
   - 終了済みルーティンはグレー背景で表示
   - 日付表示: 実施中=緑色「実施中（開始日〜）」、終了=グレー「開始日〜終了日」
4. ✅ 過去のルーティン折りたたみ
   - [components/user-routines-section.tsx](components/user-routines-section.tsx)
   - 実施中ルーティンのみメイン表示
   - 終了済みは「過去のルーティン」セクションに折りたたみ（デフォルト非表示）
5. ✅ 過去のアイテム折りたたみ
   - [components/user-items-section.tsx](components/user-items-section.tsx)
   - 利用中アイテムのみメイン表示
   - 停止済みは「過去のアイテム」セクションに折りたたみ（デフォルト非表示）
6. ✅ 活動ログフォーム更新
   - [app/page.tsx](app/page.tsx) - 終了したルーティンは選択肢に表示しない
   - `.is('ended_at', null)`でフィルタリング

### iOSアプリ連携対応 (2026-02-08)
1. ✅ APIルートの認証対応
   - [middleware.ts](middleware.ts) - `/api/`パスをミドルウェアから除外
   - iOSアプリからのリクエストがミドルウェアをバイパス可能に
2. ✅ generate-message APIの認証強化
   - [app/api/generate-message/route.ts](app/api/generate-message/route.ts) - 2種類の認証をサポート
   - **iOSアプリ**: `Authorization: Bearer <access_token>` ヘッダーで認証
   - **Webアプリ**: Cookie（セッション）ベースの認証（従来通り）
   - 未認証リクエストは401エラーを返す
   - userIdとauthenticatedUserIdの不一致は403エラーを返す
3. ✅ iOSアプリ側の対応（別リポジトリ: activity-log-sns-ios）
   - `AIMessageService.swift` - Supabaseセッションからアクセストークンを取得しリクエストに付与
4. ✅ セキュリティ
   - APIルートは常に認証必須（iOSはBearer token、WebはCookie）
   - 他人のuserIdでのリクエストは拒否

---

## iOSアプリについて

iOSネイティブアプリは別リポジトリで開発:
- **リポジトリ**: `/Users/m0112/activity-log-sns-ios`
- **技術スタック**: SwiftUI + Supabase Swift SDK
- **共有リソース**: 同じSupabaseプロジェクト・データベースを使用

### iOS連携API
| エンドポイント | 認証方法 | 説明 |
|---------------|---------|------|
| `/api/generate-message` | Bearer token | AIメッセージ生成 |
| `/api/delete-account` | Bearer token | アカウント削除 |

### アイテムカードのステータス位置変更 (2026-02-08)
1. ✅ ステータス表示位置の変更
   - [components/user-item-card.tsx](components/user-item-card.tsx) - 商品名の直下にステータスを配置
   - 変更前: 商品名 → 使い方 → ステータス
   - 変更後: 商品名 → ステータス → 使い方
   - ルーティンカードと同じ表示パターンに統一

### アカウント削除機能追加 (2026-02-08)
1. ✅ 削除API作成
   - [app/api/delete-account/route.ts](app/api/delete-account/route.ts) - アカウント削除エンドポイント
   - 2種類の認証をサポート: Bearer token（iOS）、Cookie session（Web）
   - 削除対象: Storage画像、いいね、コメント、フォロー関係、投稿、ルーティン、アイテム、プロフィール、Supabase Auth
   - `SUPABASE_SERVICE_ROLE_KEY`を使用してadmin権限でAuth削除
2. ✅ プロフィール編集フォームに削除UI追加
   - [components/profile-edit-form.tsx](components/profile-edit-form.tsx) - 「アカウントを削除」セクション追加
   - 確認ダイアログ付き（AlertDialog使用）
   - 削除処理中のローディング表示
   - 削除完了後、ログインページへリダイレクト
3. ✅ iOSアプリ対応
   - iOSアプリからもBearerトークンで同じAPIを呼び出し可能

---

**最終更新**: 2026-02-08
**更新内容**: アカウント削除機能を追加（Web/iOS両対応）
