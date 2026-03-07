#!/bin/bash

# Git操作スクリプト
cd /Users/tatsuki/Downloads/paypay

echo "📦 変更をステージング..."
git add .

echo "💾 コミット..."
git commit -m "Fix all TypeScript compilation errors"

echo "🚀 GitHubにプッシュ..."
git push origin main

echo "✅ 完了！GitHub Actionsが自動実行されます。"
