# Portfolio Viewer

> クリエイターが自分のポートフォリオを Web 上に手軽に公開するためのセルフホスト型ビューア。  
> 画像・動画に対応し、Docker さえあればどこにでも簡単に立ち上げられます。

[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

---

## Overview

自分の作品をポートフォリオサイトとして公開したいが、外部サービスに依存したくない——そんなクリエイター向けのツールです。

Docker で動くため、AWS / Azure などのクラウドサーバー、VPS、自宅サーバーなど **インターネットに公開できる環境であればどこでも動作します**。  
ポート開放ができない環境（プロバイダー制限・CGNAT など）でも、**Cloudflare Tunnel** を使えばサーバーを外部に公開できます。

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
- **SQLite 永続化** — ファイルベース DB でコンテナ再起動後もデータを保持

---

## Screenshot

<!-- スクリーンショットをここに追加してください -->
<!-- ![Portfolio Viewer](docs/screenshot.png) -->

---

## Hosting

このツールは **自分でサーバーを用意してホストする** ことを前提に設計されています。

### ホスティングの選択肢

| 方法 | 例 | ポート開放 |
| ---- | -- | ---------- |
| クラウドサーバー | AWS EC2, Azure VM, Lightsail など | サーバー側の設定で可能 |
| VPS | Conoha, さくら VPS など | サーバー側の設定で可能 |
| 自宅サーバー | 常時起動 PC / NAS | ルーターのポート転送が必要 |
| Cloudflare Tunnel | ポート開放不要 | 不要（トンネル経由で公開） |

> **ポート開放ができない場合:** プロバイダーの制限や CGNAT 環境では Cloudflare Tunnel が最も手軽な選択肢です。詳細は [Cloudflare Tunnel のセットアップ](#cloudflare-tunnel-のセットアップ) を参照してください。

---

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com) & Docker Compose

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/sora-kisaragi/game-designer-portfolio-viewer.git
cd game-designer-portfolio-viewer

# 環境変数ファイルを作成
cp .env.example .env
```

`.env` を開いて `BASIC_AUTH_USER` と `BASIC_AUTH_PASSWORD` を設定してください。

```bash
# ビルドして起動
docker compose up --build -d
```

ブラウザで `http://<サーバーのIPまたはドメイン>:3010` にアクセスするとビューアが表示されます。

---

## Configuration

| 変数名                    | デフォルト値             | 説明                              |
| ------------------------- | ------------------------ | --------------------------------- |
| `BASIC_AUTH_USER`         | `admin`                  | 管理パネルのユーザー名            |
| `BASIC_AUTH_PASSWORD`     | —                        | 管理パネルのパスワード（必須）    |
| `DB_PATH`                 | `/app/data/portfolio.db` | SQLite データベースのパス         |
| `UPLOAD_DIR`              | `/app/data/uploads`      | アップロードファイルの保存先      |
| `PORT`                    | `3010`                   | アプリが listen するポート        |
| `CLOUDFLARE_TUNNEL_TOKEN` | —                        | Cloudflare Tunnel トークン        |
| `COMPOSE_PROFILES`        | —                        | `tunnel` を設定するとトンネル起動 |

---

## Admin Panel

管理パネル (`/admin`) では以下の操作が可能です。Basic 認証でアクセスが保護されています。

- **アップロード** — 画像・動画ファイルをドラッグ&ドロップ（複数同時可）
- **順序変更** — ドラッグで並べ替え
- **一括削除** — チェックボックスで選択して削除

アップロード上限は 1 ファイルあたり **50 MB** です。

---

## Cloudflare Tunnel のセットアップ

ポート開放ができない環境でも、Cloudflare Tunnel を使えば独自ドメインで外部公開できます。

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com) でトンネルを作成し、トークンを取得
1. `.env` に以下を追加

```env
CLOUDFLARE_TUNNEL_TOKEN=your_token_here
COMPOSE_PROFILES=tunnel
```

1. 起動

```bash
docker compose up --build -d
```

`COMPOSE_PROFILES=tunnel` が設定されていると、`cloudflared` コンテナが自動的に起動してトンネルを確立します。

---

## Local Development

```bash
# Node.js 18 以上が必要
npm install
npm run dev
```

`http://localhost:3000` でビューア、`http://localhost:3000/admin` で管理パネルが開きます（開発時は認証なし）。

---

## Tech Stack

| Category   | Technology                           |
| ---------- | ------------------------------------ |
| Framework  | Next.js 16 (App Router)              |
| UI         | React 19, Tailwind CSS v4, shadcn/ui |
| Database   | better-sqlite3 (SQLite)              |
| Deployment | Docker, Cloudflare Tunnel            |

---

## License

[MIT](LICENSE) © M.S.
