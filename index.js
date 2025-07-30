#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { program } = require('commander');

const execAsync = promisify(exec);

class MP4Processor {
  constructor(targetDir = null, forceCompress = false) {
    this.currentDir = targetDir || process.cwd();
    this.doneDir = path.join(this.currentDir, 'Done');
    this.processedDir = path.join(this.currentDir, 'Processed');
    this.errorDir = path.join(this.currentDir, 'Error');
    this.forceCompress = forceCompress;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  async ensureDirectories() {
    const dirs = [this.doneDir, this.processedDir, this.errorDir];
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`创建目录: ${path.basename(dir)}`);
      }
    }
  }

  async getMp4Files() {
    const files = await fs.readdir(this.currentDir);
    return files.filter(file =>
      file.toLowerCase().endsWith('.mp4') || file.toLowerCase().endsWith('.MP4')
    );
  }

  async getVideoInfo(filePath) {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
      );
      const info = JSON.parse(stdout);

      const videoStream = info.streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        throw new Error('不是有效的视频文件');
      }

      return {
        width: parseInt(videoStream.width),
        height: parseInt(videoStream.height),
        isValid: true
      };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  async moveFile(source, destination) {
    await fs.rename(source, destination);
    console.log(`移动文件: ${path.basename(source)} -> ${path.dirname(destination)}`);
  }

  async compressVideo(inputPath, outputPath, isLandscape) {
    // 目标分辨率：横屏1280x720，竖屏720x1280
    const targetWidth = isLandscape ? 1280 : 720;
    const targetHeight = isLandscape ? 720 : 1280;

    // 使用scale和pad滤镜来处理比例问题
    // scale: 缩放到目标尺寸内，保持宽高比
    // pad: 添加黑边到目标尺寸
    const videoFilter = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`;

    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -c:a aac -vf "${videoFilter}" "${outputPath}" -y`;

    console.log(`开始压缩: ${path.basename(inputPath)} -> ${targetWidth}x${targetHeight}`);
    try {
      await execAsync(command);
      console.log(`压缩完成: ${path.basename(outputPath)}`);
    } catch (error) {
      throw new Error(`压缩失败: ${error.message}`);
    }
  }

  async processFile(fileName) {
    const filePath = path.join(this.currentDir, fileName);
    console.log(`\n处理文件: ${fileName}`);

    // 获取原文件大小
    const originalSize = await this.getFileSize(filePath);
    console.log(`原文件大小: ${this.formatFileSize(originalSize)}`);

    // 获取视频信息
    const videoInfo = await this.getVideoInfo(filePath);

    if (!videoInfo.isValid) {
      console.log(`无效视频文件，移动到Error目录`);
      await this.moveFile(filePath, path.join(this.errorDir, fileName));
      return;
    }

    const { width, height } = videoInfo;

    console.log(`视频分辨率: ${width}x${height}`);

    // 判断横屏还是竖屏
    const isLandscape = width > height;
    console.log(`视频方向: ${isLandscape ? '横屏' : '竖屏'}`);

    // 判断是否需要压缩：检查较短边是否大于720，或者强制压缩模式
    const shorterSide = Math.min(width, height);
    const needsCompression = shorterSide > 720 || this.forceCompress;

    if (!needsCompression) {
      console.log(`较短边${shorterSide}小于等于720P，直接移动到Done目录`);
      await this.moveFile(filePath, path.join(this.doneDir, fileName));
      return;
    }

    if (this.forceCompress && shorterSide <= 720) {
      console.log(`强制压缩模式：较短边${shorterSide} <= 720，仍进行压缩`);
    } else {
      console.log(`较短边${shorterSide} > 720，需要压缩`);
    }

    // 压缩视频
    const outputPath = path.join(this.doneDir, fileName);
    try {
      await this.compressVideo(filePath, outputPath, isLandscape);

      // 获取压缩后文件大小
      const compressedSize = await this.getFileSize(outputPath);

      // 检查压缩后的文件是否有效（大于0字节）
      if (compressedSize === 0) {
        throw new Error('压缩后文件为0字节');
      }

      console.log(`压缩后大小: ${this.formatFileSize(compressedSize)}`);

      // 计算压缩比例
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      console.log(`压缩比例: ${compressionRatio}% (节省 ${this.formatFileSize(originalSize - compressedSize)})`);

      // 压缩成功后，移动原文件到Processed目录
      await this.moveFile(filePath, path.join(this.processedDir, fileName));
    } catch (error) {
      console.error(`处理文件失败: ${fileName}, 错误: ${error.message}`);

      // 删除Done目录下可能生成的0字节或损坏文件
      try {
        await fs.access(outputPath);
        // 文件存在，删除它
        await fs.unlink(outputPath);
        console.log(`删除失败的输出文件: ${path.basename(outputPath)}`);
      } catch (deleteError) {
        // 忽略删除文件时的错误（文件可能不存在）
      }

      // 如果压缩失败，将原文件移动到Error目录
      await this.moveFile(filePath, path.join(this.errorDir, fileName));
    }
  }

  async run() {
    console.log('MP4文件处理工具启动...');
    console.log(`工作目录: ${this.currentDir}`);
    if (this.forceCompress) {
      console.log('🔥 强制压缩模式：将压缩所有视频文件');
    }

    // 确保目录存在
    await this.ensureDirectories();

    let processedCount = 0;

    while (true) {
      const mp4Files = await this.getMp4Files();

      if (mp4Files.length === 0) {
        console.log('\n✅ 当前目录下没有MP4文件需要处理');
        break;
      }

      console.log(`\n找到 ${mp4Files.length} 个MP4文件待处理`);

      for (const file of mp4Files) {
        try {
          await this.processFile(file);
          processedCount++;
        } catch (error) {
          console.error(`处理文件 ${file} 时发生错误:`, error.message);
        }
      }
    }

    console.log(`\n🎉 处理完成！总共处理了 ${processedCount} 个文件`);
  }
}

// 命令行配置
program
  .name('mp4-compresser')
  .description('MP4文件批量处理工具')
  .version('1.0.0')
  .option('-d, --dir <directory>', '指定处理目录')
  .option('-f, --force', '强制压缩所有视频，包括小于720P的视频')
  .action(async (options) => {
    const processor = new MP4Processor(options.dir, options.force);
    try {
      await processor.run();
    } catch (error) {
      console.error('程序执行出错:', error.message);
      process.exit(1);
    }
  });

program.parse()