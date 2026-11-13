export const profile = {
  name: '唐睿',
  nameEn: 'TANG RUI',
  role: 'AI 短视频编导',
  roleEn: 'AI SHORT VIDEO DIRECTOR',
  major: '网络与新媒体 · 2027 届',
  city: '广州',
  headline: '让想法，成为画面',
  headlineEn: 'IDEAS IN MOTION, ALWAYS',
  disciplines: ['视频后期（AE）', 'AI 内容制作', '内容策划'],
  oneLiner: '一个能把「热梗」做成「产线」的人',
  oneLinerEn: 'Not a showreel. A production line, and the judgment behind it.',
  email: '2901941647@qq.com',
  phone: '134-1016-4607',
  douyin: 'https://v.douyin.com/YjJrjhLU2ZM/',
  availability: '5 天/周 · 6 个月及以上',
};

export const stats = [
  { value: '3′12″', label: '原创影片', sub: '17 镜 · 一人全流程' },
  { value: '27', label: '张概念原画', sub: '机甲 / 角色 / 场景' },
  { value: '60%', label: '物料提效', sub: '漫剧工业化产线' },
  { value: '60', label: '条选题库', sub: '30 天冷启动排期' },
];

export type Category = 'film' | 'ai' | 'pipeline' | 'motion' | 'brand' | 'doc';

export const categories: Array<{ id: Category | 'all'; label: string; en: string }> = [
  { id: 'all', label: '全部作品', en: 'ALL' },
  { id: 'film', label: '原创影像', en: 'FILM' },
  { id: 'ai', label: 'AI 叙事', en: 'AI VISUALS' },
  { id: 'pipeline', label: '产线', en: 'PIPELINE' },
  { id: 'motion', label: '动态图形', en: 'MOTION' },
  { id: 'brand', label: '商业项目', en: 'COMMERCIAL' },
  { id: 'doc', label: '方法与文档', en: 'DOCUMENTS' },
];

export interface VideoClip {
  src: string;
  poster: string;
  label: string;
  duration: string;
}

export interface Work {
  id: string;
  no: string;
  title: string;
  titleEn: string;
  category: Category;
  categoryLabel: string;
  year: string;
  meta: string;
  cover: string;
  coverPosition?: string;
  gallery: string[];
  videos?: VideoClip[];
  summary: string;
  description: string;
  points: string[];
  tools: string[];
  logo?: string;
  notes?: { why: string; decision: string; answer: string };
}

// BASE_URL 在 dev 为 '/'，在 GitHub Pages 子路径构建时为 './'
const W = `${import.meta.env.BASE_URL}works/`;
const G = `${import.meta.env.BASE_URL}gallery/`;

export const works: Work[] = [
  {
    id: 'anshi',
    no: '01',
    title: '安史之乱',
    titleEn: 'AN SHI REBELLION · 755—763',
    category: 'film',
    categoryLabel: '原创影片 / HISTORICAL FILM',
    year: '2026',
    meta: '60″ · 1920×1080 · 代码绘制',
    cover: W + 'anshi_02.jpg',
    gallery: [W + 'anshi_02.jpg', W + 'anshi_01.jpg', W + 'anshi_03.jpg', W + 'anshi_04.jpg', W + 'anshi_05.jpg', W + 'anshi_06.jpg', W + 'anshi_07.jpg'],
    videos: [{ src: W + 'anshi.mp4', poster: W + 'anshi_02.jpg', label: '成片', duration: '60″' }],
    summary: '一场叛乱，把唐从盛世推入藩镇与南方的时代。',
    description:
      '一部 60 秒的唐风历史科普片，以「制度失衡 → 八年兵燹 → 盛世不再」三幕因果链，讲清安史之乱如何改写此后二百年的中国。全部画面由代码手绘 SVG 矢量生成（唐式木刻 + 敦煌写经卷轴装帧），音乐、音效与环境声由算法合成，无外部素材、不花积分。史实严谨：在册户数 891 万 → 193 万明确为统计口径而非死亡人数，规避「死了三千万」的误读。',
    points: [
      '视觉系统自定：绢本纸纹、石青石绿、朱红方印、回纹绫边，把浮世绘改造成唐式木刻，规避国潮大红金祥云俗套',
      '六段插画全部手写 SVG 矢量（2× 超采样抗锯齿），canvas 只保留动态叠层与文字，可确定性重渲染',
      '音频全内置合成：五声音阶羽调式 BGM + 战鼓脉冲 + 塞外风 / 石窟 / 纸卷三种环境底噪',
      '信息克制：以天平倾斜作开场记忆点，户数锐减明确标注统计口径，拒绝戏说与红颜祸水式归因',
    ],
    tools: ['Canvas 2D', '手写 SVG 矢量', 'Web Audio 合成', '确定性渲染管线', '古籍装帧设计'],
    notes: {
      why: '历史科普最易滑向戏说或堆数据；用「制度失衡」一个切口讲因果。',
      decision: '不用 AI 生图、不引外部素材，全部代码绘制以保证可复现与零成本。',
      answer: '「户数减了多少？」——891 万到 193 万是统计脱籍，不是死亡数。',
    },
  },
  {
    id: 'beginning',
    no: '02',
    title: '我从未见过自己的开始',
    titleEn: 'I HAVE NEVER SEEN MY OWN BEGINNING',
    category: 'film',
    categoryLabel: '原创影片 / POETIC SCIENCE FILM',
    year: '2026',
    meta: '3′12″ · 21:9 · 17 镜 · 无口播',
    cover: W + 'begin_cover.jpg',
    gallery: [W + 'begin_cover.jpg', W + 'begin_06.jpg', W + 'begin_07.jpg', W + 'begin_03.jpg', W + 'begin_04.jpg', W + 'begin_05.jpg'],
    videos: [{ src: W + 'beginning.mp4', poster: W + 'begin_cover.jpg', label: '成片', duration: '3′12″' }],
    summary: '我们没见过自己的开始，但身体里全是它留下的证据。',
    description:
      '一部 3 分 12 秒的诗性科普短片，21:9 画幅、17 个长镜头、全片无口播。以「深时微光」为视觉语法：全片只留一个暖色光点，其余压到近黑；用化石、骨骼与地层做证据，而不是卡通猿人。从原始夜海的一点微光开始，经同心虹膜、细胞分裂、鱼鳍长出四指、地层里的化石、走过地平线的巨兽、生命之树，到眼睛与日出，把三十八亿年收进同一条证据链。',
    points: [
      '17 镜长镜头结构，中英双语书法字幕承担全部叙述，全程无口播',
      '视觉系统自定「深时微光」：近黑底 + 单一暖光锚点，全片不用一张亮底信息图',
      '关键结论用行楷大字单独停留，不配图标；标志性镜头是人手 / 鲸鳍 / 蝙蝠翼三副骨骼并置',
      '画面全部代码绘制、音乐与音效算法合成，零素材库、零积分、可确定性重渲染',
      '史实克制：只用「三十八亿年」「一亿年」这类公认量级，不虚构物种名与年代',
    ],
    tools: ['Canvas 2D', 'Web Audio 合成', '确定性渲染', '书法字幕排版', 'Premiere'],
    notes: {
      why: '科普片最容易滑向信息图与「猿人排队走路」，所以反过来做：只留一点光。',
      decision: '不拍猿人、不做图标、不加旁白，让化石和骨骼自己说话。',
      answer: '「为什么这么暗？」——因为我们本来就是靠一点光，才看见自己的开始。',
    },
  },
  {
    id: 'netease',
    no: '04',
    title: 'AI 漫剧工业化',
    titleEn: 'AI DRAMA PRODUCTION LINE',
    category: 'pipeline',
    categoryLabel: '实习项目 / NETEASE GAMES',
    year: '2026.09 — 至今',
    meta: '网易互娱 · 内容制作 · 已脱敏',
    cover: W + 'netease_canvas.jpg',
    coverPosition: 'center top',
    gallery: [W + 'netease_canvas.jpg', W + 'netease_workbench.jpg'],
    logo: W + 'logos/netease.png',
    summary: '不是会用工具，是能把它变成产线。',
    description:
      '参与内部 AI 漫剧生产工具的实际制作链路：剧本解析 → 资产制作 → 分镜制作 → 批量输出。把「角色 / 场景 / 光位 / 景别 / 运镜」拆成可替换变量的提示词模板，按同场景、同角色、同光位聚类批跑，减少风格跳变。',
    points: [
      '剧本解析：台本拆成分集 / 片段，标出戏剧冲突与情绪高潮点',
      '资产制作：角色模型卡（三视图锚点）+ 场景锚点，锁死外观',
      '分镜制作：逐镜提示词 + 音频驱动，口型 / 呼吸 / 情绪跟着音轨走',
      '连戏检查清单：五官 / 服饰 / 光影方向 / 道具位置四项逐镜比对，不过就回退锚点重出',
      '单套物料提效 60%——不是生成更快，是返工更少',
    ],
    tools: ['内部生产工具', '提示词模板库', '三视图矩阵', 'Premiere', '剪映专业版'],
    notes: {
      why: '「会做一条」和「能稳定做一百条」是两件事。',
      decision: '先锚点再生成；同场景同光位聚类批跑。',
      answer: '「60% 提效哪来的？」——不是生成更快，是返工更少。',
    },
  },
  {
    id: 'ivl',
    no: '05',
    title: '2026 IVL 秋季赛 · DOU5',
    titleEn: 'IDENTITY V · LEAGUE VISUALS',
    category: 'motion',
    categoryLabel: '赛事动态图形 / MOTION GRAPHICS',
    year: '2026',
    meta: '3 条动态视觉 · 第五人格赛事',
    cover: W + 'ivl-roster.jpg',
    gallery: [W + 'ivl-roster.jpg', W + 'ivl-badge.jpg', W + 'ivl-logo.jpg'],
    logo: W + 'logos/dou5.png',
    videos: [
      { src: W + 'ivl-badge.mp4', poster: W + 'ivl-badge.jpg', label: '工牌入场', duration: '2.7″' },
      { src: W + 'ivl-logo.mp4', poster: W + 'ivl-logo.jpg', label: '队标演绎', duration: '12″' },
      { src: W + 'ivl-roster.mp4', poster: W + 'ivl-roster.jpg', label: '战队阵容与宣言', duration: '14″' },
    ],
    summary: '一套青绿纸质视觉体系，把战队信息做成有节奏的动态包装。',
    description:
      '围绕《第五人格》2026 IVL 秋季赛 DOU5 战队做的三条动态视觉：工牌入场、队标演绎、阵容与战队宣言。以复古纸质底纹、青绿主色与故障式描边构成统一视觉体系，信息密度与卡点节奏一致，可直接用于赛事包装与短视频切片。',
    points: [
      '统一视觉资产：固定配色、纸质纹理、描边字与条码元素',
      '三条共用一套版式与转场节奏，便于系列化延展',
      '工牌 / 队标 / 阵容三种信息层级，分别对应不同时长与播放场景',
    ],
    tools: ['After Effects', 'Photoshop', 'Premiere', '动态版式'],
  },
  {
    id: 'panyu',
    no: '06',
    title: '番禺电缆 · 品牌短视频',
    titleEn: 'BRAND VIDEO · PANYU CABLE',
    category: 'brand',
    categoryLabel: '商业项目 / COMMERCIAL DELIVERY',
    year: '2026.06 — 2026.09',
    meta: '竖屏 9:16 · AI 生成 + 后期包装',
    cover: W + 'panyu_01.jpg',
    gallery: [W + 'panyu_01.jpg', W + 'panyu_02.jpg', W + 'panyu_03.jpg', W + 'panyu_04.jpg'],
    logo: W + 'logos/panyu.png',
    summary: '把工业硬核，讲成大众愿意看的东西。',
    description:
      '为广州番禺电缆集团制作的品牌短视频。从「品牌卖点 + 客户痛点」出发，先给参考片和脚本，不先给成片；用微距特写、拟音与快节奏动效处理工业质感，同时把开头 3 秒做得足够软，让非专业观众也愿意停留。',
    points: [
      '接需求：把品牌卖点翻译成 3 个可拍的画面方向，先对齐再制作',
      '控节奏：微距特写 + 拟音 + 快节奏动效，质感要硬，开头要软',
      '按数据改：按完播反馈逆向优化开头 3 秒话术密度，改的是开头，不是整条',
    ],
    tools: ['AI 生成', '微距摄影', '拟音设计', '剪映专业版', 'After Effects'],
  },
  {
    id: 'timeline',
    no: '07',
    title: '主播的另一条时间线',
    titleEn: 'ANOTHER TIMELINE',
    category: 'doc',
    categoryLabel: '内容策划 / CONTENT STRATEGY',
    year: '2026',
    meta: '账号方案 · 60 条选题 · 30 天排期',
    cover: W + 'sb_02.jpg',
    coverPosition: 'center top',
    gallery: [W + 'sb_02.jpg', W + 'sb_03.jpg', W + 'sb_05.jpg'],
    summary: '不写游戏攻略，写主播的遗憾。',
    description:
      '一个游戏主播泛娱乐二创账号方案。母题是句式而不是故事：「如果那一下，他换了选择。」每条取一个主播真实发生过的意难平瞬间，用 AI 生成另一条时间线。固定五段结构（原声钩子 / 立情境 / AI 反转 / 回现实 / 固定尾句），配 60 条选题库与 30 天冷启动排期，可直接导入执行。',
    points: [
      '一句话定位「替全网主播补遗憾的人」，母题句式可无限系列化',
      '内容矩阵：主线遗憾补完 50% / 沙雕改编 25% / 热点快反 15% / 评论区点播 10%',
      '60 条储备选题，每条标注热点类型、形式、AI 介入度、复刻难度、优先级',
      '三集完整脚本（EP01 逐镜到秒）+ 四指标复盘与单变量迭代规则',
    ],
    tools: ['选题库', '排期表', '分镜脚本', '数据归因'],
    notes: {
      why: '观众看的是主播，不是游戏，所以做「遗憾」不做「攻略」。',
      decision: '母题必须是句式，不是故事，才能无限系列化。',
      answer: '「这号能起来吗？」——不知道，但我知道怎么验证。',
    },
  },
  {
    id: 'method',
    no: '09',
    title: '脚本 · 复盘 · 交付规范',
    titleEn: 'SCRIPT & DATA LOOP',
    category: 'doc',
    categoryLabel: '文档 / PRODUCTION NOTES',
    year: '2026',
    meta: '逐镜脚本 · 四象限归因 · 8 项链检',
    cover: W + 'method_cover.jpg',
    gallery: [W + 'sb_04.jpg', W + 'sb_05.jpg', W + 'sb_06.jpg'],
    summary: '数据不是结果，是下一个选题的输入。',
    description:
      '把「能跑量」写进文档：逐镜到秒的拍摄脚本（时间码 / 画面 / 声音 / 字幕 / AI 干预点）、发布前 8 项链检（人物一致、手部肢体、文字符号、口型配音、镜头稳定、透视画风、音画字幕、钩子尾句），以及四象限归因与单变量迭代五条规则。',
    points: [
      'EP01 52″ / 11 镜完整脚本，EP02–EP03 复用同一五段结构',
      '四象限归因：高完播高互动做模板、高完播低互动加互动钩子、低完播高互动重做前 3 秒、双低直接淘汰',
      '一次只改一个变量；24h 第一次判断，72h 最终判断，之后不再改',
      '交付规格：竖屏 1080×1920 / 24fps / H.264 8Mbps / AAC 192k',
    ],
    tools: ['拍摄脚本', '质检清单', '四象限归因', '交付规格'],
  },
  {
    id: 'concept',
    no: '10',
    title: 'AI 概念原画',
    titleEn: 'AI CONCEPT ART',
    category: 'ai',
    categoryLabel: 'AI 概念设计 / AI CONCEPT ART',
    year: '2026',
    meta: '5 张角色原画 · AI 生成',
    cover: W + 'proto_melee.jpg',
    gallery: [W + 'proto_melee.jpg', W + 'proto_mecha.jpg', W + 'proto_lumiera.jpg', W + 'proto_iso.jpg', W + 'proto_shadow.jpg'],
    summary: '把脑内的角色，先画准，再让故事成立。',
    description:
      '一组用 AI 绘制的角色概念原画，覆盖机甲、使徒、异构体与原创角色卢米艾拉等。每张都先锁定剪影、配色与材质语言，再展开细节，让角色在单图内就能立住，也为后续短片与分镜提供一致的视觉锚点。',
    points: [
      '先定剪影与色彩基调，再堆细节，避免「好看但认不出是谁」',
      '统一材质与光影方向，让不同角色属于同一世界观',
      '为后续 AI 短片提供三视图式锚点，降低连戏成本',
    ],
    tools: ['Midjourney', '即梦', 'Photoshop 精修', '角色设计'],
  },
];

export const fields = [
  {
    no: '01',
    title: '视频作品',
    en: 'VIDEO WORKS',
    line: '让画面动起来。',
    body: '原创影片、短剧与商业交付，从剧本到成片一个人走完整流程。',
    filter: 'film' as Category,
    count: '03′12″ · 17 镜',
  },
  {
    no: '02',
    title: 'AI 影像',
    en: 'AI VISUALS',
    line: '打开新的视觉语言。',
    body: '角色锚点、双关键帧、逐镜连戏，让 80+ 镜里的人还是同一个人。',
    filter: 'ai' as Category,
    count: '80+ 镜号台本',
  },
  {
    no: '03',
    title: '内容策划',
    en: 'CONTENT STRATEGY',
    line: '让选题能跑一百期。',
    body: '定位、母题句式、内容矩阵、选题库与排期，把灵感变成可复用结构。',
    filter: 'doc' as Category,
    count: '03 份文档 · 60 条选题',
  },
  {
    no: '04',
    title: '创作工具',
    en: 'CREATIVE TOOLS',
    line: '把一次性变成可复用。',
    body: '提示词模板库、批处理聚类、质检清单，让产能稳定而不是靠运气。',
    filter: 'pipeline' as Category,
    count: '60% 物料提效',
  },
];

export const pipeline = [
  { no: '01', name: '选题', en: 'IDEA', input: '热榜 / 评论 / 数据', output: '一句话选题', gate: '能一句话说完，只有一种情绪' },
  { no: '02', name: '脚本', en: 'SCRIPT', input: '钩子—情境—爆点—回落—尾句', output: '逐镜脚本', gate: '前 3 秒有钩子，结尾有固定动作' },
  { no: '03', name: '画面', en: 'VISUAL', input: '角色锚点图 → 图生视频', output: '镜头素材', gate: '角色一致 / 手部完整 / 无乱码文字' },
  { no: '04', name: '声音', en: 'SOUND', input: '旁白 / 拟音 / 情绪卡点', output: '音轨', gate: '5–6 字/秒，重音落在钩子上' },
  { no: '05', name: '剪辑', en: 'EDIT', input: '卡点 / 转场 / 调色 / 封面', output: '成片', gate: '小屏可读，字幕不压脸' },
  { no: '06', name: '复盘', en: 'REVIEW', input: '发布 / 24h 回填 / 归因', output: '下一轮选题', gate: '一次只改一个变量，72h 后不再改' },
];

export const toolchain = [
  { label: 'AI 图像', value: 'Midjourney / 即梦 / ComfyUI / PS 精修' },
  { label: 'AI 视频', value: '可灵 / Runway / 首尾帧控制' },
  { label: 'AI 音频', value: '剪映 AI 配音 / 拟音素材 / BGM 卡点' },
  { label: '剪辑包装', value: 'Premiere / 剪映专业版 / After Effects' },
];

/** 仅保留可信的两段实习经历。 */
export interface ExperienceClip {
  src: string;
  poster: string;
  label: string;
}

export interface ExperienceItem {
  period: string;
  org: string;
  role: string;
  detail: string;
  logo: string;
  lines?: { label: string; text: string }[];
  clips?: ExperienceClip[];
}

export const experience: ExperienceItem[] = [
  {
    period: '2026.09 — 至今',
    org: '网易互娱',
    role: '内容制作 · 赛事包装',
    detail: 'AI 漫剧产线与电竞赛事直播包装两条线并行：前者把剧本拆到批量输出，后者做赛事 PV、直播间视觉与战队动态物料，跟着赛程节奏交付。',
    logo: W + 'logos/netease.png',
    lines: [
      {
        label: 'AI 漫剧',
        text: '剧本拆解 → 三视图 → 分镜 → 音频驱动；搭建提示词模板库，单套物料提效 60%。',
      },
      {
        label: '赛事包装',
        text: '赛事 PV / 赛前预热片、直播间视觉包装、战队入场与阵容物料；统一配色、纸质纹理与卡点节奏，按赛程批量交付。',
      },
    ],
    clips: [
      { src: W + 'ivl-badge.mp4', poster: W + 'ivl-badge.jpg', label: '工牌入场 · 2.7″' },
      { src: W + 'ivl-logo.mp4', poster: W + 'ivl-logo.jpg', label: '队标演绎 · 12″' },
      { src: W + 'ivl-roster.mp4', poster: W + 'ivl-roster.jpg', label: '战队阵容与宣言 · 14″' },
    ],
  },
  {
    period: '2026.06 — 2026.09',
    org: '番禺电缆',
    role: '短视频',
    detail: '商业短视频全流程：卖点转选题、微距剪辑、拟音与动效；按完播反馈优化开头 3 秒。',
    logo: W + 'logos/panyu.png',
  },
];

export const principles = [
  {
    no: '01',
    title: '让画面有想法。',
    body: '一条片子好看，是运气；十条都还能看，才是方法。每个切口都要有判断，不只是好看。',
  },
  {
    no: '02',
    title: '让运动有逻辑。',
    body: '不追求一条惊艳，追求每周稳定出片。每一帧都有目的，让动态服务于表达。',
  },
  {
    no: '03',
    title: '让细节能复用。',
    body: '数据不是结果，是下一个选题的输入。把跑通的结构写成模板，才算真正交付。',
  },
];

export const aboutBlocks = [
  {
    no: '01',
    title: '我是谁',
    body: '一个同时懂「钩子」和「管线」的短视频创作者。科班出身，但更多时间泡在评论区里——知道什么梗能让人停下来，也知道停下来之后那 40 秒靠什么留住人。',
  },
  {
    no: '02',
    title: '我在做什么',
    body: '把 AI 生成变成可交付的产能：写提示词、控角色一致性、拆镜头、配音、卡点、调色，一条链路打通。不追求一条惊艳，追求每周稳定出片。',
  },
];

export const orbitImages = [
  G + 'orbit_01.jpg',
  G + 'orbit_02.jpg',
  G + 'orbit_03.jpg',
  G + 'orbit_04.jpg',
  G + 'orbit_05.jpg',
  G + 'orbit_06.jpg',
  G + 'orbit_07.jpg',
  G + 'orbit_08.jpg',
  G + 'orbit_09.jpg',
  G + 'orbit_10.jpg',
  G + 'orbit_11.jpg',
  G + 'orbit_12.jpg',
  G + 'orbit_13.jpg',
  G + 'orbit_14.jpg',
  G + 'orbit_15.jpg',
  G + 'orbit_16.jpg',
  G + 'orbit_17.jpg',
  G + 'orbit_18.jpg',
  G + 'orbit_19.jpg',
  G + 'orbit_20.jpg',
  G + 'orbit_21.jpg',
  G + 'orbit_22.jpg',
  G + 'orbit_23.jpg',
  G + 'orbit_24.jpg',
  G + 'orbit_25.jpg',
  G + 'orbit_26.jpg',
  G + 'orbit_27.jpg',
  G + 'orbit_28.jpg',
  G + 'orbit_29.jpg',
  G + 'orbit_30.jpg',
  G + 'orbit_31.jpg',
  G + 'orbit_32.jpg',
  G + 'orbit_33.jpg',
  G + 'orbit_34.jpg',
  G + 'orbit_35.jpg',
  G + 'orbit_36.jpg',
  G + 'orbit_37.jpg',
  G + 'orbit_38.jpg',
  G + 'orbit_39.jpg',
  G + 'orbit_40.jpg',
  G + 'orbit_41.jpg',
  G + 'orbit_42.jpg',
  G + 'orbit_43.jpg',
  G + 'orbit_44.jpg',
  G + 'orbit_45.jpg',
  G + 'orbit_46.jpg',
  G + 'orbit_47.jpg',
  G + 'orbit_48.jpg',
  G + 'orbit_49.jpg',
  G + 'orbit_50.jpg',
  G + 'orbit_51.jpg',
  G + 'orbit_52.jpg',
  G + 'orbit_53.jpg',
  G + 'orbit_54.jpg',
  G + 'orbit_55.jpg',
  G + 'orbit_56.jpg',
  G + 'orbit_57.jpg',
  G + 'orbit_58.jpg',
  G + 'orbit_59.jpg',
  G + 'orbit_60.jpg',
  G + 'orbit_61.jpg',
  G + 'orbit_62.jpg',
  G + 'orbit_63.jpg',
  G + 'orbit_64.jpg',
  G + 'orbit_65.jpg',
  G + 'orbit_66.jpg',
  G + 'orbit_67.jpg',
  G + 'orbit_68.jpg',
  G + 'orbit_69.jpg',
  G + 'orbit_70.jpg',
  G + 'orbit_71.jpg',
  G + 'orbit_72.jpg',
  G + 'orbit_73.jpg',
  G + 'orbit_74.jpg',
  G + 'orbit_75.jpg',
  G + 'orbit_76.jpg',
  W + 'proto_melee.jpg',
  W + 'proto_lumiera.jpg',
];
