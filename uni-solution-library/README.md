# 宇泛解决方案库

这是一个面向 GitHub Pages 的静态解决方案库，用于统一管理宇泛 AI 数智建设相关的解决方案、平台产品、子系统、文档资料和图片素材。

## 访问路径

发布后访问：

```text
https://jwu793230-debug.github.io/Temporary-display-URL/uni-solution-library/
```

本地预览建议启动静态服务：

```powershell
python -m http.server 8080
```

然后打开：

```text
http://localhost:8080/uni-solution-library/
```

## 目录说明

```text
uni-solution-library/
├─ index.html                  # 方案库首页
├─ solution.html               # 方案与平台详情页
├─ system.html                 # 子系统详情页
├─ document.html               # 文档与素材详情页
├─ assets/
│  ├─ css/styles.css           # 统一样式
│  ├─ js/                      # 数据加载、搜索和页面渲染
│  ├─ images/                  # 配图、PPT预览图、概念图
│  └─ documents/               # 正式HTML方案和相关资源
├─ data/                       # 静态JSON数据库
├─ content/                    # Markdown正文片段
└─ tools/export_solution_data.py
```

## 数据表

- `data/site.json`：站点信息、统计数据、导航和权限说明。
- `data/solutions.json`：解决方案主表。
- `data/platforms.json`：平台产品表。
- `data/systems.json`：子系统主表。
- `data/domains.json`：子系统业务域表。
- `data/documents.json`：文档资料表。
- `data/media.json`：图片素材表。
- `data/tags.json`：标签表。
- `data/relations.json`：方案、平台、系统、文档和素材之间的关系表。

## 内容维护

1. 新增图片：放入 `assets/images/`，并在 `data/media.json` 中登记。
2. 新增文档：放入 `assets/documents/`，并在 `data/documents.json` 中登记。
3. 新增子系统：在 `data/systems.json` 中新增记录，同时可在 `content/systems/` 中放对应 Markdown 正文。
4. 新增方案：在 `data/solutions.json` 中新增记录，并通过 `systemIds`、`platformIds`、`documentIds` 关联已有内容。
5. 从当前 Codex 工作区重新导出正式方案数据时，可运行：

```powershell
python uni-solution-library\tools\export_solution_data.py
```

## 权限说明

当前仓库是公开 GitHub Pages 静态站点，页面中的“公开版 / 内部版 / 客户定制版”只是内容分级标签，不是真实访问控制。

如需真实权限，建议后续升级为：

- 公开站点：只发布公开版 JSON 和公开素材。
- 内部站点：放在私有仓库、企业网盘或内部对象存储。
- 后台系统：接入登录、角色权限和数据库，按用户角色返回内容。
