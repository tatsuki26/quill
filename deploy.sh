#!/bin/bash

# デプロイスクリプト
# 実装完了時は、このスクリプトのコミットメッセージを実装内容に合わせて修正してください

# コミットメッセージ（実装内容に合わせて修正してください）
COMMIT_MESSAGE="明細詳細画面の下部にレシート画像を表示する機能を追加"

# Git操作
git add .
git commit -m "$COMMIT_MESSAGE"
git push origin main

echo "デプロイが完了しました"
