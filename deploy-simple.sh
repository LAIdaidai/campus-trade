#!/bin/bash

# 校园交易平台 简化部署脚本
# 适用于生产环境快速部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目配置
PROJECT_DIR="/opt/campus-trade"
PM2_APP_NAME="campus-trade"

# Git处理函数 - 增强稳定性
handle_git_conflicts() {
    echo -e "${BLUE}检测Git状态...${NC}"
    
    # 检查是否有未提交的修改
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo -e "${YELLOW}检测到本地修改，开始安全处理...${NC}"
        
        # 显示修改摘要
        echo -e "${CYAN}修改摘要:${NC}"
        git diff --stat
        git diff --cached --stat
        
        # 自动选择最安全的方案：暂存本地修改，拉取后自动合并
        echo -e "${BLUE}自动暂存本地修改...${NC}"
        git stash push -m "部署前本地修改 $(date '+%Y-%m-%d %H:%M:%S')"
        
        # 确保远程仓库是最新的
        echo -e "${BLUE}获取远程更新...${NC}"
        git fetch origin
        
        # 拉取远程更新
        echo -e "${BLUE}拉取远程更新...${NC}"
        if ! git pull origin master; then
            echo -e "${RED}拉取失败，尝试强制拉取...${NC}"
            git reset --hard origin/master
        fi
        
        # 尝试应用本地修改
        echo -e "${BLUE}尝试应用本地修改...${NC}"
        if ! git stash pop; then
            echo -e "${YELLOW}自动合并失败，丢弃本地修改以确保更新成功...${NC}"
            git stash drop
            echo -e "${GREEN}✓ 已使用远程最新版本${NC}"
        else
            echo -e "${GREEN}✓ 本地修改已成功合并${NC}"
        fi
        
        echo -e "${GREEN}✓ Git操作完成${NC}"
    else
        echo -e "${GREEN}✓ 没有本地修改，直接拉取${NC}"
        
        # 确保远程仓库是最新的
        echo -e "${BLUE}获取远程更新...${NC}"
        git fetch origin
        
        # 直接拉取远程更新
        echo -e "${BLUE}拉取远程更新...${NC}"
        if ! git pull origin master; then
            echo -e "${RED}拉取失败，尝试强制拉取...${NC}"
            git reset --hard origin/master
        fi
        
        echo -e "${GREEN}✓ Git拉取完成${NC}"
    fi
    
    # 验证Git状态
    echo -e "${BLUE}验证Git状态...${NC}"
    git status --porcelain
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Git状态正常${NC}"
    else
        echo -e "${YELLOW}⚠ Git状态异常，但继续执行${NC}"
    fi
}

echo -e "${BLUE}校园交易平台 - 快速部署脚本${NC}"
echo "=================================="

# 检查root权限
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误: 请使用root权限运行此脚本${NC}"
    echo "使用: sudo ./deploy-simple.sh"
    exit 1
fi

# 检查必要工具
echo -e "${BLUE}检查环境...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js 未安装${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm 未安装${NC}"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo -e "${YELLOW}安装PM2...${NC}"; npm install -g pm2; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker 未安装${NC}"; exit 1; }

# 处理Git更新
if [ -d ".git" ]; then
    handle_git_conflicts
else
    echo -e "${YELLOW}警告: 未检测到Git仓库，跳过代码更新${NC}"
fi

# 创建目录
echo -e "${BLUE}创建目录...${NC}"
mkdir -p "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/backend/uploads"

# 检测和启动MySQL
echo -e "${BLUE}检测MySQL服务...${NC}"

# 检测系统MySQL服务
if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld; then
    echo -e "${GREEN}✓ 检测到系统MySQL服务正在运行${NC}"
    MYSQL_TYPE="system"
elif docker ps --format 'table {{.Names}}' | grep -q "mysql"; then
    echo -e "${GREEN}✓ 检测到Docker MySQL容器正在运行${NC}"
    MYSQL_TYPE="docker_running"
elif docker ps -a --format 'table {{.Names}}' | grep -q "mysql"; then
    echo -e "${YELLOW}检测到Docker MySQL容器已存在但未运行，正在启动...${NC}"
    docker start mysql
    MYSQL_TYPE="docker_started"
else
    echo -e "${YELLOW}未检测到MySQL服务，正在安装Docker MySQL...${NC}"
    MYSQL_TYPE="docker_new"
fi

# 根据检测结果处理MySQL
case $MYSQL_TYPE in
    "system")
        echo -e "${GREEN}使用现有系统MySQL服务${NC}"
        ;;
    "docker_running")
        echo -e "${GREEN}使用现有Docker MySQL容器${NC}"
        ;;
    "docker_started")
        echo -e "${YELLOW}等待Docker MySQL启动...${NC}"
        sleep 10
        ;;
    "docker_new")
        echo -e "${YELLOW}需要配置MySQL数据库信息${NC}"
        read -p "请输入MySQL root密码 (默认: campus_trade_root_2024): " MYSQL_ROOT_PASSWORD
        MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-campus_trade_root_2024}
        
        read -p "请输入数据库名称 (默认: campus_trade): " DB_NAME
        DB_NAME=${DB_NAME:-campus_trade}
        
        read -p "请输入数据库用户名 (默认: campus_user): " DB_USER
        DB_USER=${DB_USER:-campus_user}
        
        read -p "请输入数据库密码 (默认: campus_trade_2024): " DB_PASSWORD
        DB_PASSWORD=${DB_PASSWORD:-campus_trade_2024}
        
        # 显示将要使用的配置信息
        echo -e "${CYAN}MySQL配置信息:${NC}"
        echo -e "  Root密码: $MYSQL_ROOT_PASSWORD"
        echo -e "  数据库名: $DB_NAME"
        echo -e "  用户名: $DB_USER"
        echo -e "  用户密码: $DB_PASSWORD"
        
        echo -e "${BLUE}创建Docker MySQL容器...${NC}"
        docker run -d \
            --name mysql \
            --restart unless-stopped \
            -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
            -e MYSQL_DATABASE="$DB_NAME" \
            -e MYSQL_USER="$DB_USER" \
            -e MYSQL_PASSWORD="$DB_PASSWORD" \
            -e TZ=Asia/Shanghai \
            -p 3306:3306 \
            -v "$PROJECT_DIR/backend/database:/docker-entrypoint-initdb.d:ro" \
            mysql:8.0 \
            --default-authentication-plugin=mysql_native_password \
            --character-set-server=utf8mb4 \
            --collation-server=utf8mb4_unicode_ci
        
        echo -e "${YELLOW}等待MySQL启动...${NC}"
        sleep 20
        
        # 等待MySQL完全启动
        echo -e "${BLUE}等待MySQL服务就绪...${NC}"
        for i in {1..60}; do
            if docker exec mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
                echo -e "${GREEN}✓ MySQL服务已就绪${NC}"
                break
            fi
            echo -n "."
            sleep 2
        done
        ;;
esac

# 安装依赖
echo -e "${BLUE}安装依赖...${NC}"

# 清理npm缓存
echo -e "${YELLOW}清理npm缓存...${NC}"
npm cache clean --force 2>/dev/null || true

# 根目录依赖
echo -e "${YELLOW}安装根目录依赖...${NC}"
cd "$PROJECT_DIR"
if [ -f "package.json" ]; then
    rm -rf node_modules package-lock.json 2>/dev/null || true
    npm install --no-optional --production=false
fi

# 后端依赖
echo -e "${YELLOW}安装后端依赖...${NC}"
cd "$PROJECT_DIR/backend"
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install --no-optional --production=false

# 前端依赖
echo -e "${YELLOW}安装前端依赖...${NC}"
cd "$PROJECT_DIR/frontend"
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install --no-optional --production=false

# 安装构建必需的依赖
echo -e "${YELLOW}安装构建必需依赖...${NC}"
npm install terser --save-dev --force 2>/dev/null || true
npm install @vitejs/plugin-vue --save-dev --force 2>/dev/null || true
npm install vite --save-dev --force 2>/dev/null || true

# 验证关键依赖
echo -e "${YELLOW}验证关键依赖...${NC}"
cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ] || [ ! -d "node_modules/bcryptjs" ]; then
    echo -e "${RED}错误: 关键依赖安装失败${NC}"
    echo -e "${YELLOW}尝试重新安装...${NC}"
    npm install bcryptjs --save
fi

# 创建环境配置
echo -e "${BLUE}创建环境配置...${NC}"

# 如果.env文件已存在且包含数据库配置，则使用现有配置
if [ -f "$PROJECT_DIR/.env" ] && grep -q "DB_HOST" "$PROJECT_DIR/.env"; then
    echo -e "${GREEN}使用现有环境配置${NC}"
    # 从现有配置中读取数据库信息
    source "$PROJECT_DIR/.env"
else
    # 根据MySQL类型设置数据库配置
    case $MYSQL_TYPE in
        "system")
            # 系统MySQL，需要用户输入配置
            echo -e "${YELLOW}配置系统MySQL连接信息${NC}"
            read -p "请输入MySQL主机 (默认: localhost): " DB_HOST
            DB_HOST=${DB_HOST:-localhost}
            
            read -p "请输入MySQL端口 (默认: 3306): " DB_PORT
            DB_PORT=${DB_PORT:-3306}
            
            read -p "请输入数据库名称 (默认: campus_trade): " DB_NAME
            DB_NAME=${DB_NAME:-campus_trade}
            
            read -p "请输入数据库用户名 (默认: root): " DB_USER
            DB_USER=${DB_USER:-root}
            
            read -p "请输入数据库密码: " DB_PASSWORD
            ;;
        *)
            # Docker MySQL，使用之前配置的信息
            DB_HOST="localhost"
            DB_PORT="3306"
            DB_NAME=${DB_NAME:-campus_trade}
            DB_USER=${DB_USER:-campus_user}
            DB_PASSWORD=${DB_PASSWORD:-campus_trade_2024}
            ;;
    esac
    
    # 获取其他必要配置
    echo -e "${YELLOW}配置应用信息${NC}"
    read -p "请输入JWT密钥 (默认: campus_trade_jwt_secret_key_2024_production): " JWT_SECRET
    JWT_SECRET=${JWT_SECRET:-campus_trade_jwt_secret_key_2024_production}
    
    read -p "请输入应用端口 (默认: 3000): " APP_PORT
    APP_PORT=${APP_PORT:-3000}
    
    echo -e "${YELLOW}配置邮件服务（可选）${NC}"
    read -p "请输入SMTP服务器 (默认: smtp.qq.com): " SMTP_HOST
    SMTP_HOST=${SMTP_HOST:-smtp.qq.com}
    
    read -p "请输入SMTP端口 (默认: 587): " SMTP_PORT
    SMTP_PORT=${SMTP_PORT:-587}
    
    read -p "请输入邮箱账号 (默认: your_email@qq.com): " SMTP_USER
    SMTP_USER=${SMTP_USER:-your_email@qq.com}
    
    read -p "请输入邮箱密码 (默认: your_email_password): " SMTP_PASS
    SMTP_PASS=${SMTP_PASS:-your_email_password}
    
    # 自动获取服务器信息
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    SERVER_HOSTNAME=$(hostname -f 2>/dev/null || echo "localhost")
    
    # 创建.env文件
    cat > "$PROJECT_DIR/.env" << EOF
# 数据库配置
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# JWT配置
JWT_SECRET=$JWT_SECRET

# 应用配置
NODE_ENV=production
PORT=$APP_PORT
BASE_URL=http://$SERVER_IP:$APP_PORT
ALLOWED_ORIGINS=http://$SERVER_IP:80,http://$SERVER_IP:$APP_PORT,http://$SERVER_HOSTNAME:80,http://$SERVER_HOSTNAME:$APP_PORT

# 服务器信息
SERVER_IP=$SERVER_IP
SERVER_HOSTNAME=$SERVER_HOSTNAME

# 邮件配置
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
EOF
fi

# 构建项目
echo -e "${BLUE}构建项目...${NC}"
cd "$PROJECT_DIR/backend"
npm run build

cd "$PROJECT_DIR/frontend"
# 尝试构建前端
if npm run build 2>/dev/null; then
    echo -e "${GREEN}✓ 前端构建成功${NC}"
else
    echo -e "${YELLOW}前端构建失败，尝试修复依赖...${NC}"
    
    # 清理依赖并重新安装
    rm -rf node_modules package-lock.json
    npm install --force
    
    # 确保关键依赖存在
    npm install terser @vitejs/plugin-vue vite --save-dev --force
    
    if npm run build; then
        echo -e "${GREEN}✓ 前端构建成功${NC}"
    else
        echo -e "${RED}前端构建仍然失败${NC}"
        echo -e "${YELLOW}请手动检查前端依赖${NC}"
        exit 1
    fi
fi

# 启动PM2服务
echo -e "${BLUE}启动PM2服务...${NC}"
pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true

cat > "$PROJECT_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: '$PROJECT_DIR/backend/dist/server.js',
    cwd: '$PROJECT_DIR/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT
    },
    error_file: '$PROJECT_DIR/logs/error.log',
    out_file: '$PROJECT_DIR/logs/out.log',
    log_file: '$PROJECT_DIR/logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
EOF

pm2 start "$PROJECT_DIR/ecosystem.config.js"
pm2 save
pm2 startup

# 启动前端服务
echo -e "${BLUE}启动前端服务...${NC}"

# 设置默认前端端口
FRONTEND_PORT=5173

# 检查端口是否被占用，如果被占用则寻找下一个可用端口（排除80端口）
while netstat -tlnp | grep -q ":$FRONTEND_PORT " || [ "$FRONTEND_PORT" = "80" ]; do
    if [ "$FRONTEND_PORT" = "80" ]; then
        echo -e "${YELLOW}跳过80端口（避免与Nginx冲突），尝试下一个端口...${NC}"
    else
        echo -e "${YELLOW}端口 $FRONTEND_PORT 已被占用，尝试下一个端口...${NC}"
    fi
    FRONTEND_PORT=$((FRONTEND_PORT + 1))
done

echo -e "${GREEN}✓ 使用端口 $FRONTEND_PORT 启动前端服务${NC}"

# 启动Vite预览服务器（使用无限制模式）
cd "$PROJECT_DIR/frontend"
echo -e "${YELLOW}启动前端预览服务器在端口 $FRONTEND_PORT...${NC}"
VITE_PORT=$FRONTEND_PORT VITE_DISABLE_HOST_CHECK=true nohup npm run preview:unrestricted > "$PROJECT_DIR/logs/frontend.log" 2>&1 &

sleep 5

if netstat -tlnp | grep -q ":$FRONTEND_PORT "; then
    echo -e "${GREEN}✓ 前端服务启动成功，端口: $FRONTEND_PORT${NC}"
    FRONTEND_URL="http://$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost"):$FRONTEND_PORT"
    
    # 更新环境变量中的端口
    if [ -f "$PROJECT_DIR/.env" ]; then
        sed -i "s/FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" "$PROJECT_DIR/.env" 2>/dev/null || true
    fi
else
    echo -e "${RED}✗ 前端服务启动失败${NC}"
    echo -e "${YELLOW}请检查日志: tail -f $PROJECT_DIR/logs/frontend.log${NC}"
    FRONTEND_URL="未启动"
fi

# 获取服务器IP用于显示
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}      校园交易平台部署完成！${NC}"
echo -e "${GREEN}==========================================${NC}"
echo -e "后端API: http://$SERVER_IP:$APP_PORT"
echo -e "数据库: $SERVER_IP:3306"
if [ "$FRONTEND_URL" != "未启动" ]; then
    echo -e "前端: $FRONTEND_URL"
else
    echo -e "前端: ${RED}启动失败${NC}"
fi
echo -e "${CYAN}服务器信息:${NC}"
echo -e "  IP地址: $SERVER_IP"
echo -e "  主机名: $(hostname -f 2>/dev/null || echo 'localhost')"
echo -e "${GREEN}==========================================${NC}"

# 显示状态
echo -e "${BLUE}服务状态:${NC}"
pm2 status
