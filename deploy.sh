#!/bin/bash

# デプロイスクリプト
# 実装完了時は、このスクリプトのコミットメッセージを実装内容に合わせて修正してください

# コミットメッセージ（実装内容に合わせて修正してください）
COMMIT_MESSAGE="ロゴを入れ替え：logo-quill.pngをヘッダーに、logo.pngを＋ボタンに。ヘッダー背景色を再分類ボタンより暗めの緑に変更"

# Git操作
git add .
git commit -m "$COMMIT_MESSAGE"
git push origin main

echo "デプロイが完了しました"
