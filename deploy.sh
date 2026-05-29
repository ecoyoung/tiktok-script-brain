#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# TikTok Script Brain — 一键部署脚本
# 使用 Cloudflare Tunnel 暴露服务，无需 Nginx/Certbot
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ---------- 检查 .env ----------
if [ ! -f .env ]; then
  echo ">>> 创建 .env 文件..."
  cp .env.docker .env
  echo ""
  echo "!! 请编辑 .env 填入 DEEPSEEK_API_KEY，然后重新运行此脚本。"
  echo "   vim .env"
  exit 1
fi

if grep -q "your_api_key_here" .env; then
  echo "!! .env 中的 DEEPSEEK_API_KEY 还是占位值，请先修改。"
  echo "   vim .env"
  exit 1
fi

# ---------- 构建并启动 ----------
echo ">>> 构建并启动容器..."
docker compose up -d --build

echo ""
echo ">>> 容器已启动，应用运行在 http://localhost:3005"
echo ""
echo ">>> Cloudflare Tunnel 配置："
echo "    在你的 tunnel config（或 Cloudflare Dashboard）中添加："
echo ""
echo "    Public hostname: script.ekspaces.com"
echo "    Service:         http://localhost:3005"
echo ""
echo "    如果用命令行："
echo "    cloudflared tunnel route dns <你的tunnel名> script.ekspaces.com"
echo ""
echo "    然后在 tunnel config.yml 的 ingress 中加："
echo "    - hostname: script.ekspaces.com"
echo "      service: http://localhost:3005"
echo ""
echo "    最后重启 tunnel。"
