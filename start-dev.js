#!/usr/bin/env node

/**
 * 开发环境启动脚本
 * 自动检测环境并启动前后端服务
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${color}${message}${colors.reset}`);
};

// 检查环境变量文件
const checkEnvFile = () => {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    log(colors.yellow, '⚠️  未找到 .env 文件，将使用默认配置');
    return false;
  }
  return true;
};

// 启动后端服务
const startBackend = () => {
  return new Promise((resolve, reject) => {
    log(colors.blue, '🚀 启动后端服务...');
    
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'pipe',
      shell: true
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on port')) {
        log(colors.green, '✅ 后端服务启动成功');
        resolve(backendProcess);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Error') || error.includes('error')) {
        log(colors.red, `❌ 后端启动错误: ${error}`);
      }
    });

    backendProcess.on('error', (error) => {
      log(colors.red, `❌ 后端启动失败: ${error.message}`);
      reject(error);
    });

    // 设置超时
    setTimeout(() => {
      if (!backendProcess.killed) {
        log(colors.green, '✅ 后端服务启动完成');
        resolve(backendProcess);
      }
    }, 5000);
  });
};

// 启动前端服务
const startFrontend = () => {
  return new Promise((resolve, reject) => {
    log(colors.blue, '🚀 启动前端服务...');
    
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe',
      shell: true
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('localhost:')) {
        log(colors.green, '✅ 前端服务启动成功');
        resolve(frontendProcess);
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Error') || error.includes('error')) {
        log(colors.red, `❌ 前端启动错误: ${error}`);
      }
    });

    frontendProcess.on('error', (error) => {
      log(colors.red, `❌ 前端启动失败: ${error.message}`);
      reject(error);
    });

    // 设置超时
    setTimeout(() => {
      if (!frontendProcess.killed) {
        log(colors.green, '✅ 前端服务启动完成');
        resolve(frontendProcess);
      }
    }, 5000);
  });
};

// 检查端口是否被占用
const checkPort = (port) => {
  return new Promise((resolve) => {
    exec(`netstat -tlnp | grep :${port}`, (error, stdout) => {
      resolve(stdout.length > 0);
    });
  });
};

// 主函数
const main = async () => {
  log(colors.purple, '🎯 校园交易平台开发环境启动器');
  log(colors.cyan, '=====================================');

  // 检查环境
  checkEnvFile();

  // 检查端口占用
  const backendPort = 3000;
  const frontendPort = 5173;

  if (await checkPort(backendPort)) {
    log(colors.yellow, `⚠️  端口 ${backendPort} 已被占用，后端服务可能已在运行`);
  }

  if (await checkPort(frontendPort)) {
    log(colors.yellow, `⚠️  端口 ${frontendPort} 已被占用，前端服务可能已在运行`);
  }

  try {
    // 启动后端
    const backendProcess = await startBackend();
    
    // 等待后端完全启动
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 启动前端
    const frontendProcess = await startFrontend();

    log(colors.green, '🎉 所有服务启动完成！');
    log(colors.cyan, '=====================================');
    log(colors.blue, `📱 前端地址: http://localhost:${frontendPort}`);
    log(colors.blue, `🔧 后端地址: http://localhost:${backendPort}`);
    log(colors.cyan, '=====================================');
    log(colors.yellow, '按 Ctrl+C 停止所有服务');

    // 处理退出信号
    const cleanup = () => {
      log(colors.yellow, '\n🛑 正在停止服务...');
      backendProcess.kill();
      frontendProcess.kill();
      log(colors.green, '✅ 所有服务已停止');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    log(colors.red, `❌ 启动失败: ${error.message}`);
    process.exit(1);
  }
};

// 运行主函数
main().catch(console.error);