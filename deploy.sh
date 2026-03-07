#!/bin/bash

# デプロイスクリプト
# 実装完了時は、このスクリプトのコミットメッセージを実装内容に合わせて修正してください

# コミットメッセージ（実装内容に合わせて修正してください）
COMMIT_MESSAGE="ダッシュボードのレイアウト修正（カードの横はみ出し修正、今月の収入削除、今月の取引数に変更）。明細一覧にもFABボタンを追加"

# Git操作
git add .
git commit -m "$COMMIT_MESSAGE"
git push origin main

echo "デプロイが完了しました"
