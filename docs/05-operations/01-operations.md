# 運用手順書

> このドキュメントは作成中です。内容を随時追記してください。

## デプロイ手順

```bash
# main にマージ後、サーバー側で実行
docker compose up --build -d
```

## ログ確認

```bash
docker compose logs app -f
docker compose logs cloudflared -f
```

## バックアップ

- SQLite DB: `./data/portfolio.db`
- アップロード画像: `./data/uploads/`

## 障害対応

- （未記入）
