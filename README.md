# 唐睿 TANG RUI — 作品集网站

以实时 4K 木星 3D 场景为首屏的个人作品集，参考 [xiaolumotion.cn](https://www.xiaolumotion.cn/) 的编号章节、大标题与留白排版语言，内容全部来自本人真实资料与作品。

## 启动

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 类型检查 + 生产构建到 dist/
npm run preview
```

## 结构

```text
src/
├─ portfolio/            # 作品集页面
│  ├─ data.ts            # 个人资料、8 个作品、经历、工具链、画廊
│  ├─ Site.tsx           # 页面组装与全部交互状态
│  ├─ Header.tsx         # 固定导航 + 移动端抽屉
│  ├─ Hero.tsx           # 木星首屏
│  ├─ Works.tsx          # 筛选网格 + 作品详情（含视频播放）
│  ├─ sections.tsx       # 图像漫游 / 领域 / 产线 / 关于 / 联系
│  ├─ ui.tsx             # 图标、弹窗、Toast、章节圆点、逐字揭示
│  ├─ effects.ts         # 滚动揭示、视差、光标光晕、磁性 hover
│  └─ portfolio.css      # 完整设计系统（含响应式 / reduced-motion）
├─ components/           # JupiterScene / Starfield + react-bits 组件
└─ assets/textures/      # 4K 木星、2K 太阳贴图
public/works/            # 作品图片、三个赛事视频及其封面帧
```

## 交互

作品分类筛选、作品详情（图片切换 / 视频播放 / 上一个下一个 / 方向键 / Esc）、图像漫游灯箱、领域卡跳转筛选、联系方式弹窗、复制邮箱与电话、下载 vCard 名片、章节圆点导航、移动端抽屉、Toast 提示。

## 内容与署名

- 实习经历**仅保留网易互娱与番禺电缆**两段；其他经历已从内容层移除。
- 木星 / 太阳贴图：Solar System Scope，CC BY 4.0（Wikimedia Commons）。
- react-bits 组件：DavidHDev/react-bits，MIT。
- 字体：Inter / Playfair Display（Google Fonts，SIL OFL）。

## 性能

移除了泛光后处理与 `backdrop-filter`，DPR 上限 1.5，各向异性过滤设为 4，3D 渲染在首屏离开视口后暂停；在 Intel UHD 630 核显上实测约 120 FPS。

## 部署

`vite.config.ts` 使用 `base: './'`，资源路径通过 `import.meta.env.BASE_URL` 生成，可直接部署到 GitHub Pages 项目子路径。
