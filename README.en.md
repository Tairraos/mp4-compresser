# MP4 Video Processor

A Node.js CLI tool for batch processing MP4 videos with intelligent compression and scaling.

[中文文档](README.md) | **English**

## Features

- 🔍 Automatically scan all MP4 files in current directory
- 📏 Detect video resolution, archive files smaller than 720P directly
- 🎬 Identify landscape/portrait videos with different compression strategies
- 🗜️ High-quality compression using FFmpeg (H.264 + AAC)
- 🔥 Force compression mode: compress all videos including those smaller than 720P
- 📁 Automatically create and manage folders (Done/Processed/Error)
- ♻️ Continuous processing until directory is empty

## System Requirements

### Dependencies
- Node.js >= 16.0.0
- FFmpeg (including ffprobe)
- npm or pnpm package manager

### Install FFmpeg (macOS)
```bash
brew install ffmpeg
```

### Install Project Dependencies
```bash
npm install
```

## Installation and Usage

### Global Installation (Recommended)

1. **One-click installation**:
   ```bash
   ./install-global.sh
   ```

2. **Use in any directory**:
   ```bash
   # Process MP4 files in current directory
   mp4-compressor
   
   # Specify other directory
   mp4-compressor -d "/path/to/your/video/directory"
   
   # Force compress all videos (including those smaller than 720P)
   mp4-compressor -f
   
   # Combine parameters
   mp4-compressor -d "/path/to/videos" -f
   
   # View help
   mp4-compressor --help
   ```

3. **Uninstall global command**:
   ```bash
   npm unlink -g mp4-compressor
   ```

### Local Usage

If you don't want global installation, you can run directly in project directory:

```bash
# Use default directory
node index.js

# Specify other directory
node index.js -d "/path/to/your/video/directory"
```

## Processing Logic

1. **Scan Files**: Find all .mp4/.MP4 files in current directory
2. **Validate Files**: Use ffprobe to check if files are valid videos
3. **Resolution Check**: 
   - Shorter side ≤ 720: Move directly to `Done/` directory (unless using `-f` force compression)
   - Shorter side > 720: Perform compression
   - Force mode (`-f`): Compress all videos regardless of resolution
4. **Compression Settings**:
   - Landscape videos: Scale to 1280x720, maintain aspect ratio
   - Portrait videos: Scale to 720x1280, maintain aspect ratio
   - Aspect ratio handling: Automatically add black bars to maintain target dimensions
   - Encoding: H.264 (libx264) + AAC audio
5. **File Management**:
   - Compressed files: Save to `Done/` directory
   - Original files: Move to `Processed/` directory
   - Invalid files: Move to `Error/` directory

## Directory Structure

After processing, the following subdirectories will be automatically created in the working directory:

```
Working Directory/
├── *.mp4          # MP4 files to be processed
├── Done/          # Processed video files
├── Processed/     # Original processed files
└── Error/         # Invalid or failed files
```

## Notes

- Ensure sufficient disk space for compression operations
- Large file compression may take considerable time
- Recommend backing up important files before processing
- Tool will run continuously until no MP4 files remain in current directory

## Troubleshooting

If you encounter issues, please check:
1. FFmpeg is properly installed: `ffmpeg -version`
2. File permissions are sufficient
3. Disk space is adequate
4. Video files are not corrupted