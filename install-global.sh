#!/bin/bash

echo "🚀 安装MP4处理工具为全局命令..."
echo "================================"

# 检查是否在项目目录中
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录中运行此脚本"
    exit 1
fi

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm未安装，请先安装pnpm"
    exit 1
fi

# 安装依赖
echo "📦 安装项目依赖..."
pnpm install

# 全局链接
echo "🔗 创建全局链接..."
pnpm link --global

echo ""
echo "🎉 安装完成！"
echo ""
echo "现在你可以在任意目录使用以下命令："
echo "  mp4-processor                    # 使用默认目录"
echo "  mp4-processor -d /path/to/dir    # 指定目录"
echo "  mp4-processor --help             # 查看帮助"
echo ""
echo "卸载命令："
echo "  pnpm unlink --global mp4-processor"
echo ""