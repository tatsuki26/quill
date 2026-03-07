#!/bin/bash

# デプロイスクリプト
# 実装完了時は、このスクリプトのコミットメッセージを実装内容に合わせて修正してください

# コミットメッセージ（実装内容に合わせて修正してください）
COMMIT_MESSAGE="手動入力に明細の詳細機能を追加（レシートから商品情報を自動抽出）。取引詳細画面を追加"

# Git操作
git add .
git commit -m "$COMMIT_MESSAGE"
git push origin main

echo "デプロイが完了しました"
