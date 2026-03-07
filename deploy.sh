#!/bin/bash

# デプロイスクリプト
# 実装完了時は、このスクリプトのコミットメッセージを実装内容に合わせて修正してください

# コミットメッセージ（実装内容に合わせて修正してください）
COMMIT_MESSAGE="手動入力機能、レシート解析機能、資産管理機能を追加。ヘッダーデザインを更新してロゴを表示"

# Git操作
git add .
git commit -m "$COMMIT_MESSAGE"
git push origin main

echo "デプロイが完了しました"
