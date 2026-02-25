# PicMan

PicMan 是一款基于 Tauri 和 React 构建的现代本地图片压缩桌面应用。它支持通过拖拽批量处理图片，利用 WebAssembly 技术在全本地环境中完成高质量的图片压缩与格式转换，全程无云端数据上传，充分保障您的隐私和本地数据安全。

## 🌟 项目介绍

1. **纯本地处理**：所有的图片压缩与转化操作均通过 WebAssembly 技术在本地设备的浏览器内核中运行，安全省心。
2. **多格式支持**：兼容大部分现代和主流图片编码，支持 JPEG、PNG、WebP、AVIF、JXL 以至 HEIF 等多种图片格式。
3. **直观效果对比**：提供直观的对比视图弹窗与详细状态数据，便于用户实时评估体积减少与画质变化。
4. **现代化 UI 体验**：结合系统级别的深浅色模式适配，利用流畅的动画效果与极简界面设计，为用户带来优雅的使用体验。

## 🛠 技术栈

### 前端开发
- **框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite](https://vitejs.dev/)
- **样式与组件库**：[TailwindCSS v4](https://tailwindcss.com/) + [HeroUI](https://heroui.com/)
- **微交互与动画**：[Framer Motion](https://www.framer.com/motion/)
- **包管理工具**：完全基于 pnpm

### 后端内核底层 & 引擎
- **跨平台桌面支持**：基于强大的 Rust 图形应用容器 [Tauri 2.0](https://v2.tauri.app/) 构建
- **核心压缩能力 (WASM)**：使用了高效的跨语言 WebAssembly 压缩模块库如 `@jsquash` 生态 (avif, jpeg, jxl, oxipng, png, webp) 及 `libheif-js` 进行硬件受限或多媒体转换处理。

## 📂 文件夹目录说明

```text
PicMan/
├── src/                # 前端项目的核心代码存放位置
│   ├── assets/         # 独立于公共资源的特有前端资源文件
│   ├── components/     # 大部分 React 基础复用功能组件 (FileList, DropZone, CompareModal, SettingsBar)
│   ├── core/           # 项目的主功能引擎库文件 (包括最重要的 WebAssembly 压缩调度与映射转换实现)
│   ├── hooks/          # 自定义 React Hooks，封装抽象的数据与交互逻辑 (如处理上传任务的 useCompressor)
│   ├── utils/          # 共用的数据切片和转换等辅助函数
│   ├── App.tsx         # 单页应用的最外层统一路由、功能挂载器
│   ├── index.css       # TailwindCSS 相关的整体通用样式控制
│   └── main.tsx        # React DOM 渲染挂载文件
├── src-tauri/          # Tauri 后端交互逻辑和 Rust 拓展层目录
│   ├── src/            # Rust 与原生组件对接或者定制方法的源码
│   ├── Cargo.toml      # Tauri (Rust) 应用库以及版本声明清单
│   └── tauri.conf.json # Tauri 应用程序配置文件（窗口、打包选项等）
├── docs/               # 技术理解与协作维护使用产生的说明文档 (如压缩格式支持细节)
├── public/             # 需要全局可引的公共静态数据或静态资源 (例如 Logo 、外挂插件)
├── index.html          # Vite 运行使用的默认首页入口文件
├── package.json        # 整个项目的 Node.js 环境配置说明书与脚本注册库
├── vite.config.ts      # Vite 的构建配置体系策略中心 (如 WasM 设定)
└── pnpm-lock.yaml      # 依赖精确锁定树文件
```
