#!/bin/bash

echo "🚀 准备发布MP4视频处理工具到npm..."
echo "=================================="

# 检查是否登录npm
if ! npm whoami &> /dev/null; then
    echo "❌ 请先登录npm: npm login"
    exit 1
fi

echo "✅ npm用户: $(npm whoami)"

# 检查package.json中的必要字段
if ! grep -q '"name"' package.json; then
    echo "❌ package.json缺少name字段"
    exit 1
fi

if ! grep -q '"version"' package.json; then
    echo "❌ package.json缺少version字段"
    exit 1
fi

# 检查是否有README
if [ ! -f "README.md" ]; then
    echo "❌ 缺少README.md文件"
    exit 1
fi

# 检查是否有LICENSE
if [ ! -f "LICENSE" ]; then
    echo "❌ 缺少LICENSE文件"
    exit 1
fi

# 检查主文件是否存在
if [ ! -f "index.js" ]; then
    echo "❌ 缺少主文件index.js"
    exit 1
fi

# 检查文件权限
if [ ! -x "index.js" ]; then
    echo "⚠️  设置index.js为可执行文件"
    chmod +x index.js
fi

echo "✅ 所有检查通过"

# 显示将要发布的文件
echo ""
echo "📦 将要发布的文件:"
npm pack --dry-run

echo ""
echo "📋 包信息:"
echo "名称: $(grep '"name"' package.json | cut -d'"' -f4)"
echo "版本: $(grep '"version"' package.json | cut -d'"' -f4)"
echo "描述: $(grep '"description"' package.json | cut -d'"' -f4)"

echo ""
read -p "确认发布? (y/N): " confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "🚀 开始发布..."
    npm publish
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 发布成功!"
        echo ""
        echo "安装命令:"
        echo "  npm install -g $(grep '"name"' package.json | cut -d'"' -f4)"
        echo ""
        echo "使用命令:"
        echo "  mp4-compresser"
        echo ""
    else
        echo "❌ 发布失败"
        exit 1
    fi
else
    echo "❌ 取消发布"
    exit 1
fi