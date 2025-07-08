
# Bilibili UP主主页视频时长高亮脚本

这是一个为 [Tampermonkey (油猴)](https://www.tampermonkey.net/) 设计的用户脚本。它可以在 Bilibili 网站的UP主个人空间页面，根据视频的时长，为视频卡片右下角的时间标签添加不同颜色的背景高亮，让您能快速筛选出感兴趣时长的视频。

---

## 安装方法

1.  **安装脚本管理器**
    *   您需要一个用户脚本管理器来运行此脚本。推荐使用 [**Tampermonkey**](https://www.tampermonkey.net/)，它支持所有主流浏览器，如 Chrome, Firefox, Edge, Safari等。
    *   请根据您的浏览器，从其官网或应用商店下载并安装。

2.  **安装本脚本**
    *   **从 GitHub 安装**（似乎不太稳定）:
        *   打开项目中的 `bilibili-duration-highlighter.user.js` 脚本文件。
        *   点击页面右上角的 "Raw" (原始文件) 按钮。
        *   Tampermonkey 会自动识别并弹出安装页面，点击 "安装"。
    *   **备用方法**:
        *   点击油猴->添加新脚本
        *   删除所有默认的代码
        *   将 `bilibili-duration-highlighter.user.js` 中的所有代码复制到添加的新脚本中
        *   点击文件->保存（快捷键 Ctrl+S 或 Cmd+S）

安装完成后，访问任意B站UP主的个人空间视频页 (例如 `https://space.bilibili.com/`)，脚本将自动生效。

## 如何自定义

1.  在 Tampermonkey 管理面板中找到本脚本，点击**编辑**按钮。
2.  找到代码开头的 `// --- 用户配置区域 ---` 部分。

```javascript
// --- 用户配置区域 ---
const CONFIG = {
    // 时长阈值和样式配置
    thresholds: [
        { threshold: 60, color: 'rgba(130, 215, 174, 0.3)', label: '1分钟内' }, // 0-1分钟
        { threshold: 180, color: 'rgba(139, 195, 74, 0.4)', label: '3分钟内' }, // 1-3分钟
        { threshold: 300, color: 'rgba(67, 160, 71, 0.5)', label: '5分钟内' }, // 3-5分钟
        { threshold: 600, color: 'rgba(33, 150, 243, 0.6)', label: '10分钟内' }, // 5-10分钟
        { threshold: 1800, color: 'rgba(255, 152, 0, 0.7)', label: '30分钟内' }, // 10-30分钟
        { threshold: 3600, color: 'rgba(244, 67, 54, 0.8)', label: '1小时内' }, // 30-60分钟
        { threshold: Infinity, color: 'rgba(156, 39, 176, 0.9)', label: '超长视频' } // 超过1小时
    ],
    // 是否在标签上显示文字提示 (例如 "10分钟内")
    showLabel: true,
    // 应用于时长标签的通用样式
    style: {
        color: 'white', // 文字颜色
        padding: '1px 6px', // 内边距
        borderRadius: '4px', // 圆角
        fontWeight: 'bold', // 字体加粗
    }
};
// --- 配置区域结束 ---
```

*   `thresholds`: 这是一个规则数组，脚本会从上到下匹配。
    *   `threshold`: 时长阈值，单位为**秒**。例如 `60` 代表小于60秒的视频。
    *   `color`: 应用的背景颜色，推荐使用 `rgba(r, g, b, a)` 格式，其中 `a` 是透明度（0到1），方便看清背景。
    *   `label`: 鼠标悬停时显示的文字提示。
    *   **重要**：请确保将**时长短的规则放在前面**，时长长的规则放在后面。最后的 `Infinity` 规则会匹配所有未被前面规则匹配到的超长视频。
*   `showLabel`: 一个布尔值 (`true` 或 `false`)。如果设为 `true`，鼠标悬停在时长标签上会显示 `label` 定义的提示信息。
*   `style`: 一个CSS样式对象，用于统一设置所有高亮标签的样式，例如文字颜色、内边距、圆角等。

修改完成后，保存脚本即可立即生效（可能需要刷新一下B站页面）。

## 脚本技术细节 (API)

以下是脚本中核心函数的说明。

### `parseDurationToSeconds(timeStr)`

*   **作用**: 将B站视频卡片上 "HH:MM:SS" 或 "MM:SS" 格式的时间字符串，解析并转换为总秒数，以便于进行数值比较。
*   **参数**:
    *   `@param {string} timeStr`: 从DOM中获取的原始时间字符串，例如 `"05:20"` 或 `"01:10:30"`。
*   **返回值**:
    *   `@returns {number}`: 转换后的总秒数。如果输入无效，则返回 `0`。

### `highlightVideoDurations()`

*   **作用**: 这是脚本的核心处理函数。它会查询页面上所有尚未被处理过的视频卡片 (`.upload-video-card`, `.video-card-body` 等)，获取每个视频的时长，然后根据 `CONFIG` 中的规则为其应用高亮样式。
*   **参数**: 无。
*   **返回值**: 无返回值 (`void`)。

### `observeDOMChanges()`

*   **作用**: 使用 `MutationObserver` Web API 来监视整个页面的DOM变化。当用户滚动页面，B站动态加载出新的视频列表时，`MutationObserver` 会捕获到这些变化，并重新调用 `highlightVideoDurations()` 函数来处理新出现的视频卡片，实现无缝的动态高亮。
*   **参数**: 无。
*   **返回值**: 无返回值 (`void`)。
