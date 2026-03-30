# Git 運用ルール — GitHub Flow

## ブランチ戦略

- `main` ブランチは常にデプロイ可能な状態を保つ
- 作業は必ず `main` から feature ブランチを切って行う
- ブランチ名は `feature/xxx`, `fix/xxx`, `chore/xxx` の形式

```
main
 └── feature/add-sorting-ui   ← 作業ブランチ
 └── fix/upload-error
```

## 作業フロー

```bash
# 1. 最新の main から作業ブランチを作成
git switch main
git pull origin main
git switch -c feature/xxx

# 2. 作業・コミット（適切な粒度で）
git add <files>
git commit -m "feat: ..."

# 3. PR を作成して main にマージ
gh pr create

# 4. マージ後はブランチを削除
git branch -d feature/xxx
```

## コミットメッセージ規約（Conventional Commits）

```
<type>: <概要>
```

| type | 用途 |
|---|---|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `chore` | 依存更新・設定変更 |
| `refactor` | 動作を変えないリファクタ |
| `docs` | ドキュメントのみの変更 |

## main への直接プッシュ禁止

- 緊急の小修正を除き、必ず PR 経由でマージする
- セルフマージは可（1人運用のため）

## デプロイ

- `main` へのマージ後、サーバー側で `docker compose up --build -d` を手動実行してデプロイ
