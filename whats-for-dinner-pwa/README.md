# What’s-for-dinner PWA 本地版

这是一个纯前端家庭菜单 PWA：库存、家庭口味、餐单、吃饭日志先保存在当前浏览器本地；需要多设备同步时，在同步页配置 GitHub 私有仓库数据文件。

## 本地运行

在本目录执行：

```powershell
python -m http.server 8788 --bind 127.0.0.1
```

然后访问：

```text
http://127.0.0.1:8788/index.html
```

## 当前功能

- 首页：按餐次、家庭成员、库存和忌口生成本地规则配餐建议。
- 厨房：新增、调整、移除库存食材。
- 家庭：维护 3 个家庭成员的口味、忌口和默认参与状态。
- 餐单：确认待做餐单，做完后扣减库存并生成吃饭日志。
- 同步：保存 GitHub owner/repo/branch/path/token，支持推送、拉取、导出、导入 JSON。
- AI：无前端 API Key；同步页可生成 Codex 数据包，后续可封装 Skill 读取 GitHub 数据并给建议。

## 数据说明

- 业务数据：`localStorage` 的 `wfd.state.v1`。
- 主题习惯：`localStorage` 的 `wfd.theme`，只保存在本机。
- GitHub Token：`localStorage` 的 `wfd.github.token`，不会进入导出的 JSON。
- GitHub 同步文件默认路径：`whats-for-dinner-pwa/data/whats-for-dinner.json`。

## 初始家庭默认

- 初始成员：噜噜、噜妹儿、团团。
- 早餐默认：噜妹儿、团团。
- 午餐默认：噜妹儿。
- 晚餐默认：噜噜、噜妹儿、团团。
