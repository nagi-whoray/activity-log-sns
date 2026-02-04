# Activity Log SNS

Next.js 14とSupabaseを使った活動ログSNSアプリケーション

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **認証・データベース**: Supabase
- **デプロイ**: Vercel (推奨)

## プロジェクト構造

```
activity-log-sns/
├── app/                    # Next.js App Router
│   ├── auth/
│   │   └── callback/      # Supabase認証コールバック
│   ├── login/             # ログインページ
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ（投稿一覧）
├── components/            # Reactコンポーネント
│   ├── ui/               # shadcn/uiコンポーネント
│   ├── header.tsx        # ヘッダーコンポーネント
│   ├── login-form.tsx    # ログインフォーム
│   ├── post-form.tsx     # 投稿フォーム
│   └── post-list.tsx     # 投稿一覧
├── lib/                  # ユーティリティ
│   ├── supabase/
│   │   ├── client.ts    # クライアントサイドSupabaseクライアント
│   │   └── server.ts    # サーバーサイドSupabaseクライアント
│   └── utils.ts         # ユーティリティ関数
├── types/               # 型定義
│   ├── database.ts      # データベーススキーマ型
│   └── index.ts         # アプリケーション型
└── middleware.ts        # 認証ミドルウェア
```

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

### 2. 環境変数の設定

`.env.local`ファイルに以下を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. データベーステーブルの作成

SupabaseのSQL Editorで以下のSQLを実行:

```sql
-- プロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投稿テーブル
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- プロフィールのポリシー
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 投稿のポリシー
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- 新規ユーザー登録時に自動でプロフィールを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. 依存関係のインストール

```bash
npm install
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 機能

- **ユーザー認証**: メールアドレスとパスワードでの登録・ログイン
- **投稿機能**: 活動ログの投稿（最大500文字）
- **投稿一覧**: すべてのユーザーの投稿をタイムライン表示
- **リアルタイム更新**: 投稿後すぐに一覧に反映

## 今後の拡張案

- プロフィール編集機能
- 投稿の編集・削除機能
- いいね機能
- コメント機能
- 画像アップロード
- フォロー機能
- リアルタイム更新（Supabase Realtime）
- 無限スクロール

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
