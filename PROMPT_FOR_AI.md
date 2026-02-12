# Deep Focus Reader — AI 开发指令

> 将此文件完整发送给 AI，让它基于当前项目代码完成所有待实现功能。

---

## 一、项目背景

这是一个**英语学习阅读器**（Deep Focus Reader），帮助中文用户通过阅读英文文章来学英语。核心使用流程是：

1. 用户上传一篇英文文章（支持 PDF / Word / TXT / 直接粘贴文本）
2. 系统用英文朗读出来（TTS），支持整篇朗读和逐句朗读
3. 每句英文下方可以显示中文翻译（双语对照模式）
4. 用户点击任意英文单词时，弹窗显示该单词的音标、英文释义和中文释义
5. 用户可以收藏生词到闪卡，后续复习
6. 所有导入的文章保存在"图书馆"中，可以随时回来继续学习

---

## 二、技术栈（严格遵守，不要改变）

- **纯静态 HTML + 原生 JavaScript**（不使用 React / Vue / Next.js 等框架）
- **Tailwind CSS**（通过 CDN 引入：`https://cdn.tailwindcss.com`）
- **Google Fonts**：Space Grotesk（UI）、Spectral（标题）、Crimson Pro（英文正文）、Noto Serif SC（中文）
- **Google Material Icons Round**
- **部署平台**：Vercel（Serverless Functions 放在 `/api` 目录）
- **本地数据持久化**：localStorage 或 IndexedDB
- **运行方式**：`npx vercel dev`，开发地址 `http://localhost:3000`

---

## 三、当前项目结构

```
stitch_library_dashboard/
├── index.html                          # 模块导航中心（已完成）
├── api/
│   └── tts-proxy.js                    # TTS API 代理（已完成）
├── the_study_reading_view/
│   └── code.html                       # ⭐ 核心阅读页面（部分完成）
├── library_dashboard/
│   └── code.html                       # 图书馆总览（仅 UI，无功能）
├── vocabulary_insights_sidebar/
│   └── code.html                       # 词汇侧边栏（仅 UI，无功能）
├── ingest_and_analysis_modal/
│   └── code.html                       # 文件上传弹窗（仅 UI，无功能）
├── text_analysis_report/
│   └── code.html                       # 文本分析报告（仅 UI，假数据）
├── reading_settings_panel/
│   └── code.html                       # 阅读设置面板（功能完成，但未集成到阅读页）
└── grammar_analysis_popover/
    └── code.html                       # 语法分析浮层（仅 UI，mock 数据）
```

---

## 四、已完成的功能

### 阅读页面 (`the_study_reading_view/code.html`)
- ✅ 文本输入/粘贴 + 预设文章加载
- ✅ 文章渲染为逐句卡片，每个单词可点击
- ✅ 点击单词弹出浮窗，显示音标、英文释义、中文释义
- ✅ TTS 整篇朗读（分块合成）
- ✅ TTS 逐句朗读 + 当前句高亮 + 自动滚动
- ✅ 音色选择（4种）、语速选择
- ✅ 停止播放
- ✅ 暗色模式切换

### TTS 代理 (`api/tts-proxy.js`)
- ✅ Vercel Serverless Function，转发到 `https://tts-webs.vercel.app/api/synthesize`
- ✅ 处理 CORS 跨域

### 阅读设置面板 (`reading_settings_panel/code.html`)
- ✅ 字号、行高、主题、双语模式设置
- ✅ localStorage 持久化
- ⚠️ 但未集成到阅读页面

### 已使用的外部 API
- TTS：`/api/tts-proxy`（代理）→ `https://tts-webs.vercel.app/api/synthesize`
- 英文词典：`https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- 翻译（Google Translate Pro）：`https://google-translate-pro.xingpeng278.workers.dev/v1/chat/completions`（OpenAI Chat Completions 兼容格式，model: `google-translate-pro`，需 Bearer Token）

---

## 五、需要实现的功能（按优先级排列）

### P0-1：文件上传与解析

**目标**：在 `ingest_and_analysis_modal/code.html` 页面实现真正的文件上传功能。

**要求**：
1. 给拖拽区域和 "Browse Files" 按钮绑定真实的文件上传事件
2. 创建一个隐藏的 `<input type="file" accept=".pdf,.docx,.txt,.epub">` 元素
3. 支持拖拽上传和点击选择文件
4. 文件解析：
   - **PDF**：通过 CDN 引入 `PDF.js`（`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js`），提取所有页面的文本
   - **Word (.docx)**：通过 CDN 引入 `mammoth.js`（`https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js`），提取纯文本
   - **TXT**：直接用 `FileReader` 读取文本内容
5. 右侧"Analysis Status"流程：
   - 解析文件时显示第一步（Parsing）为进行中
   - 解析完成后显示第二步（Translation）为进行中，开始逐句调用翻译 API
   - 翻译完成后所有步骤打勾
   - 底部按钮变为 "Ready to Read"，可点击
6. 点击 "Ready to Read" 后：
   - 将提取的文本和翻译结果保存到 `localStorage`，key 格式为 `article_{timestamp}`
   - 跳转到阅读页面：`../the_study_reading_view/code.html?article=article_{timestamp}`

**数据存储格式**（localStorage）：
```json
{
  "id": "article_1700000000000",
  "title": "文件名（去掉扩展名）",
  "text": "完整英文文本",
  "translations": {
    "0": "第一句中文翻译",
    "1": "第二句中文翻译"
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "progress": 0,
  "status": "in_progress"
}
```

---

### P0-2：阅读页面集成双语翻译显示

**目标**：在 `the_study_reading_view/code.html` 中增加逐句中文翻译显示。

**要求**：
1. 阅读页面检查 URL 参数 `?article=article_xxx`，如果有则从 localStorage 加载文章数据（包含预存的翻译），自动渲染
2. 如果没有 URL 参数，保持现有的手动输入/预设文章功能
3. 修改 `renderArticle()` 函数，在每个句子卡片中增加中文翻译行：
```html
<article data-index="0" class="sentence-card ...">
  <p class="font-english text-[19px] ...">English sentence with clickable words...</p>
  <p class="font-chinese text-[15px] text-text-chinese mt-2 cn-line" style="display:none;">中文翻译</p>
</article>
```
4. 如果文章数据中已有翻译，直接使用；如果没有（手动输入的文章），则在渲染时异步调用翻译 API 逐句翻译
5. 翻译 API 使用 Google Translate Pro（OpenAI Chat Completions 格式），见 `callTranslateAPI()` 函数
6. 增加双语模式切换按钮（放在左侧面板的 TTS 设置下方）：
   - **英文模式**：只显示英文（默认）
   - **双语对照**：英文下方显示中文
   - **悬浮中文**：中文默认隐藏，鼠标悬停在句子上时才显示
   - **仅中文**：只显示中文
7. 将用户选择的双语模式保存到 `localStorage`（key: `readingMode`）

---

### P0-3：页面间数据流通 — 图书馆动态化

**目标**：让 `library_dashboard/code.html` 动态展示用户导入的文章。

**要求**：
1. 从 localStorage 读取所有 `article_*` 开头的数据
2. 动态生成瀑布流卡片（替换现有硬编码的卡片 HTML）
3. 每张卡片显示：
   - 文章标题
   - 前 100 个字符的预览
   - 学习进度（百分比进度条）
   - 创建时间
   - 状态标签（进行中 / 已完成 / 已归档）
4. 点击卡片跳转到阅读页面：`../the_study_reading_view/code.html?article={id}`
5. 实现顶部筛选按钮：All / In Progress / Completed / Archived
6. 实现搜索功能：按标题和内容搜索
7. "New Text" 按钮点击后跳转到上传页面：`../ingest_and_analysis_modal/code.html`
8. 如果没有任何文章，显示一个空状态提示："还没有导入任何文章，点击上方按钮开始导入"

---

### P1-1：词汇收藏与闪卡系统

**目标**：在阅读页面查词时可以收藏单词，在词汇页面复习。

**要求**：
1. 修改阅读页面的单词弹窗 (`wordPopover`)，增加一个"收藏"按钮：
```html
<button id="saveWordBtn" class="mt-3 w-full py-2 rounded-xl bg-primary text-white text-sm">
  <span class="material-icons-round text-sm align-middle">bookmark_add</span> 保存到生词本
</button>
```
2. 点击后将单词数据保存到 localStorage：
```json
// key: "vocabulary"，值为数组
[
  {
    "word": "luminous",
    "phonetic": "/ˈluː.mɪ.nəs/",
    "en": "Full of or shedding light...",
    "cn": "发光的；明亮的",
    "savedAt": "2025-01-01T00:00:00.000Z",
    "reviewCount": 0,
    "lastReview": null
  }
]
```
3. 已收藏的单词再次点击时，按钮显示"已收藏 ✓"（灰色不可点击）
4. 修改 `vocabulary_insights_sidebar/code.html`：
   - 从 localStorage 读取生词本数据
   - 左侧显示生词列表（可滚动）
   - 点击某个单词时，右侧显示完整释义（复用现有的 UI 结构）
   - "Save to Flashcards" 按钮改为 "开始复习"
   - 实现简单的闪卡复习：依次显示单词，用户点击翻转看释义，标记"认识"或"不认识"

---

### P1-2：阅读进度跟踪

**目标**：在阅读时自动记录进度。

**要求**：
1. 在阅读页面，监听滚动事件，计算用户已阅读到第几句（可视区域中最后一个句子卡片）
2. 将进度百分比实时写入 localStorage 中对应文章的 `progress` 字段
3. 当进度达到 100% 时，自动将状态改为 `completed`
4. 再次打开同一篇文章时，自动滚动到上次阅读的位置

---

### P1-3：移动端导航

**目标**：小屏幕上增加底部导航栏。

**要求**：
1. 在阅读页面，当 `md:` 以下时，左侧导航栏被隐藏
2. 增加一个固定在底部的移动端导航栏（仅在小屏显示）：
```html
<nav class="fixed bottom-0 left-0 right-0 md:hidden bg-white/90 backdrop-blur border-t border-primary/10 flex justify-around py-2 z-50">
  <a href="..."><span class="material-icons-round">library_books</span></a>
  <a href="..."><span class="material-icons-round">auto_stories</span></a>
  <a href="..."><span class="material-icons-round">school</span></a>
  <a href="..."><span class="material-icons-round">upload_file</span></a>
</nav>
```
3. 所有页面都需要添加这个移动端导航栏

---

## 六、重要约束

1. **不要引入任何前端框架**（React/Vue/Angular/Next.js），保持纯 HTML + 原生 JS
2. **所有样式使用 Tailwind CSS 类名**，不写行内 style（除非 Tailwind 无法实现）
3. **保持现有 UI 设计风格**：纸质纹理背景、圆角卡片、Space Grotesk + Spectral 字体、#2c2925 主色、#C25E00 强调色
4. **每个页面仍然是独立的 HTML 文件**，通过 localStorage 共享数据
5. **翻译 API** 已切换为 Google Translate Pro（`google-translate-pro.xingpeng278.workers.dev`），需要：
   - 缓存已翻译的内容到 localStorage
   - 翻译失败时优雅降级（显示 "翻译暂不可用"）
   - 批量翻译时增加间隔（每次请求间隔 500ms），避免并发过高
6. **所有 CDN 库通过 `<script src="...">` 引入**，不使用 npm/pnpm
7. **文件处理必须在前端完成**（PDF.js / mammoth.js 都在浏览器端运行），不需要后端
8. **保持已有功能不被破坏**：现有的 TTS 朗读、单词查询、预设文章等功能必须继续正常工作

---

## 七、建议实现顺序

1. 先做 **P0-2**（阅读页面双语翻译），因为这是核心体验
2. 再做 **P0-1**（文件上传解析），让用户可以导入自己的文章
3. 然后做 **P0-3**（图书馆动态化），串联整个使用流程
4. 接着做 **P1-1**（词汇收藏），增强学习功能
5. 最后做 **P1-2** 和 **P1-3**（进度跟踪和移动端适配）

每完成一个功能模块后，请在对应的 HTML 文件顶部用注释标记完成状态，例如：
```html
<!-- [DONE] P0-2: 双语翻译显示 - 2025-xx-xx -->
```

---

## 八、测试要点

完成后请逐一验证：

- [ ] 能上传 PDF 文件并提取出英文文本
- [ ] 能上传 .docx 文件并提取出英文文本
- [ ] 能上传 .txt 文件并提取出英文文本
- [ ] 上传后自动翻译，完成后可跳转到阅读页面
- [ ] 阅读页面能显示英文 + 中文对照
- [ ] 双语模式可切换（英文/双语/悬浮/仅中文）
- [ ] 点击单词能弹出释义弹窗
- [ ] 单词弹窗有收藏按钮，收藏后可在生词本中看到
- [ ] TTS 整篇朗读正常工作
- [ ] TTS 逐句朗读 + 高亮正常工作
- [ ] 图书馆页面能显示所有导入的文章
- [ ] 图书馆搜索和筛选功能正常
- [ ] 点击图书馆卡片能跳转到对应文章的阅读页面
- [ ] 阅读进度能自动保存和恢复
- [ ] 移动端有底部导航栏
- [ ] 所有页面暗色模式正常

---

*此指令基于 2025 年项目现状生成，覆盖了从当前状态到可上线版本的所有待完成工作。*
