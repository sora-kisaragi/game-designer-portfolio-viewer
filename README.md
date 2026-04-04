# Portfolio Viewer

> ゲームデザイナー向けのセルフホスト型フルスクリーンポートフォリオビューア。  
> 画像・動画の両方に対応し、クラウド依存なしでローカル環境に完全ホストできます。

[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

---

## Features

- **フルスクリーン表示** — 16:9 レターボックスで画像・動画を最大限に表示
- **スムーズなスライドトランジション** — CSS アニメーションによる滑らかなページ送り
- **マルチナビゲーション** — キーボード矢印キー / スワイプ / タップゾーンに対応
- **ページインジケーター（3スタイル）** — ゼロ埋め番号 / プログレスバー / ドット+番号 をタップで切り替え
- **ピンチズーム対応** — モバイルでズームモードに切り替え可能
- **動画ミュート切り替え** — 動画アイテムは再生中にミュート/サウンドをトグル
- **管理パネル** — Basic 認証で保護されたアップロード・削除 UI
- **ドラッグ&ドロップ一括アップロード** — 複数ファイルをまとめてドロップ
- **一括削除** — チェックボックスで複数アイテムをまとめて削除
- **SQLite 永続化** — ファイルベースDBでコンテナ再起動後もデータを保持
- **Cloudflare Tunnel 対応** — 追加設定なしで外部公開が可能

---

## Screenshot

<!-- スクリーンショットをここに追加してください -->
<!-- ![Portfolio Viewer](docs/screenshot.png) -->

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) 18 以上 (ローカル開発時)
- [Docker](https://www.docker.com) & Docker Compose (本番運用時)

### ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/sora-kisaragi/game-designer-portfolio-viewer.git
cd game-designer-portfolio-viewer

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くとビューアが表示されます。

管理パネルは [http://localhost:3000/admin](http://localhost:3000/admin) から利用できます（認証なし）。

### Docker で起動

```bash
# 環境変数ファイルを作成
cp .env.example .env
# .env を編集して BASIC_AUTH_USER / BASIC_AUTH_PASSWORD を設定

# ビルドして起動
docker compose up --build -d
```

ブラウザで [http://localhost:3010](http://localhost:3010) を開きます。

---

## Configuration

`.env` ファイルで以下の環境変数を設定します。

| 変数名                   | デフォルト値               | 説明                              |
| ------------------------ | -------------------------- | --------------------------------- |
| `BASIC_AUTH_USER`        | `admin`                    | 管理パネルのユーザー名            |
| `BASIC_AUTH_PASSWORD`    | —                          | 管理パネルのパスワード（必須）    |
| `DB_PATH`                | `/app/data/portfolio.db`   | SQLite データベースのパス         |
| `UPLOAD_DIR`             | `/app/data/uploads`        | アップロードファイルの保存先      |
| `PORT`                   | `3010`                     | アプリが listen するポート        |
| `CLOUDFLARE_TUNNEL_TOKEN`| —                          | Cloudflare Tunnel トークン        |
| `COMPOSE_PROFILES`       | —                          | `tunnel` を設定するとトンネル起動 |

---

## Admin Panel

管理パネル (`/admin`) では以下の操作が可能です。

- **アップロード** — 画像・動画ファイルをドラッグ&ドロップ（複数同時可）
- **順序変更** — ドラッグで並べ替え
- **一括削除** — チェックボックスで選択して削除

アップロード上限は 1 ファイルあたり **50 MB** です。

---

## Deployment with Cloudflare Tunnel

外部からアクセスできるようにするには [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) を利用します。

1. Cloudflare Zero Trust でトンネルを作成し、トークンを取得
2. `.env` に `CLOUDFLARE_TUNNEL_TOKEN=<token>` と `COMPOSE_PROFILES=tunnel` を設定
3. `docker compose --profile tunnel up --build -d` で起動

```bash
COMPOSE_PROFILES=tunnel docker compose up --build -d
```

---

## Tech Stack

| Category   | Technology                            |
| ---------- | ------------------------------------- |
| Framework  | Next.js 16 (App Router)               |
| UI         | React 19, Tailwind CSS v4, shadcn/ui  |
| Database   | better-sqlite3 (SQLite)               |
| Deployment | Docker, Cloudflare Tunnel             |

---

## License

[MIT](LICENSE) © M.S.
