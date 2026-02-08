-- トリガー: 新規ユーザー登録時のdisplay_nameをNULLに変更
-- これにより、iOSアプリ側でAI名前生成が動作するようになる

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'display_name'  -- メタデータがなければNULLになる
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
