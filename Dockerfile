# --- 第一阶段：构建 ---
FROM node:24-alpine AS builder

# 1. 设置 pnpm/npm 全局镜像源环境变量
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com/

# 2. 【优化】设置环境变量并启用 Corepack
# 这步不依赖你的项目文件，所以只要 Node 版本不变，这一层永远是缓存命中的！
# 无需再运行 npm install -g pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /

# 3. 复制依赖定义文件,这里是利用 docker缓存
COPY package.json pnpm-lock.yaml ./

# 4. 安装依赖
# --frozen-lockfile: 严格按照 lock 文件安装
RUN pnpm install --frozen-lockfile

# 5. 复制源码
COPY . .

# 6. 打包
RUN pnpm build

# --- 第二阶段：运行 (Caddy) ---
FROM caddy:alpine

COPY --from=builder /dist /usr/share/caddy

# 使用 cat <<EOF 写法通常比 echo 更易读（这也是个小优化）
RUN cat <<EOF > /etc/caddy/Caddyfile
:80 {
    root * /usr/share/caddy
    encode gzip
    file_server
    try_files {path} /index.html
}
EOF

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]