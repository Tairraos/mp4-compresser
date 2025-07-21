#!/bin/bash

echo "🚀 MP4处理工具安装脚本"
echo "========================"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js (>= 16.0.0)"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm未安装，正在安装..."
    npm install -g pnpm
fi

echo "✅ pnpm版本: $(pnpm --version)"

# 检查FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg未安装"
    echo "请运行: brew install ffmpeg"
    exit 1
fi

echo "✅ FFmpeg版本: $(ffmpeg -version | head -n1)"

# 检查ffprobe
if ! command -v ffprobe &> /dev/null; then
    echo "❌ ffprobe未安装"
    echo "请运行: brew install ffmpeg"
    exit 1
fi

echo "✅ ffprobe可用"

# 安装依赖
echo "📦 安装项目依赖..."
pnpm install

echo ""
echo "🎉 安装完成！"
echo ""
echo "使用方法:"
echo "  node index.js    # 直接运行"
echo "  pnpm start       # 使用pnpm运行"
echo ""