# ExPrefecture Backend Server

Express + TypeScript + Prisma で構築されたバックエンドAPIサーバーです。

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
cd server
npm install
```

### 2. 環境変数の設定

`server`ディレクトリに`.env`ファイルを作成し、以下の環境変数を設定：

```env
# データベース
DATABASE_URL="file:./prisma/dev.db"

# JWT トークン（強力なランダム文字列を設定してください）
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# サーバー設定
PORT=8080
NODE_ENV=development

# フロントエンドURL（CORS設定用）
FRONTEND_URL=http://localhost:5173
```

**重要**:

- `ACCESS_TOKEN_SECRET`と`REFRESH_TOKEN_SECRET`は強力なランダム文字列を使用してください
- 本番環境では必ず変更してください
- 例：`openssl rand -base64 32`でランダム文字列を生成できます

### 3. データベースのセットアップ

Prismaクライアントを生成：

```bash
npm run prisma:generate
```

データベースマイグレーションを実行：

```bash
npm run prisma:migrate
```

これによりSQLiteデータベース（`dev.db`）が作成されます。

### 4. サーバーの起動

開発モード：

```bash
npm run dev
```

本番モード（ビルド後）：

```bash
npm run build
npm start
```

サーバーは `http://localhost:8080` で起動します。

## APIエンドポイント

### 認証関連

- `POST /api/auth/signup` - 新規登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/refresh` - トークンリフレッシュ
- `GET /api/auth/me` - 現在のユーザー情報取得（認証必須）
- `POST /api/auth/logout` - ログアウト（認証必須）

### その他

- `GET /health` - ヘルスチェック

## セキュリティリファクタリング

認証システムは2025年末時点のベストプラクティス（OWASP Cheat Sheet / OAuth 2.0 Security BCP RFC 9700 / OAuth 2.1）に沿って実装されています。

詳細は以下のドキュメントを参照してください：

- [セキュリティリファクタリング計画](./SECURITY_REFACTOR.md)
- [セキュリティチェックリスト](./SECURITY_CHECKLIST.md)
- [実装ガイド](./IMPLEMENTATION_GUIDE.md)

### 主なセキュリティ機能

- ✅ パスワードハッシュ化（bcrypt rounds 12）
- ✅ ユーザー列挙耐性（タイミング攻撃対策）
- ✅ Rate Limiting（ログイン: 5回/15分、サインアップ: 3回/時間）
- ✅ CSRF対策（Double Submit Cookieパターン）
- ✅ セキュアなCookie設定（HttpOnly, Secure, SameSite）
- ✅ 監査ログ（ログイン試行、ログアウト等を記録）
- ✅ ドメイン層の分離（Controller/Service/Repository）

## 認証方式

Cookie × JWTのベストプラクティスを採用：

- **アクセストークン（AT）**: 短寿命（15分）、クライアントのメモリ（セッションストレージ）に保存
- **リフレッシュトークン（RT）**: 長寿命（7日）、HttpOnly Cookieに保存
- **セキュリティ**: XSS/CSRF対策済み（HttpOnly Cookie、SameSite設定）

## データベース

- SQLite（開発環境）
- Prisma ORMを使用

Prisma Studioでデータベースを確認：

```bash
npm run prisma:studio
```

## 技術スタック

- Express.js
- TypeScript
- Prisma ORM
- JWT (jsonwebtoken)
- bcryptjs（パスワードハッシュ化）
- Zod（バリデーション）
