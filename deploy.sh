#!/bin/bash

# デプロイスクリプト
# 実装完了時は、このスクリプトのコミットメッセージを実装内容に合わせて修正してください

# コミットメッセージ（実装内容に合わせて修正してください）
COMMIT_MESSAGE="ヘッダーのロゴサイズを縮小（maxHeight 48px→36px、maxWidth 200px→150px）"

# Git操作
git add .
git commit -m "$COMMIT_MESSAGE"
git push origin main

echo "デプロイが完了しました"
