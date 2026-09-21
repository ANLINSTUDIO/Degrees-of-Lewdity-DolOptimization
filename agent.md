# 原版优化协作与发布检查

本仓库以 `Source/` 为模组源码目录，`Source/boot.json` 的 `version` 为版本基准。修改前先检查官方主分支；保留已有游戏内容、资源与依赖，不用本地旧版源码整目录覆盖。网站源码在独立的 `dolmod-site` 仓库，不在本仓库中。

## 改动验证

1. 执行 `node Source/test-smart-sort.js`，检查 JavaScript 语法及 `boot.json` 引用文件均存在。
2. 检查模组市场身份匹配、作者、仓库与 README 均来自同一条确认身份；不确定时不展示推测的作者或仓库。
3. README 图片必须通过受限的同源代理或内嵌数据加载，不能直接依赖被 `img-src 'self' data:` 阻止的 GitHub 图片地址。
4. 确认 1.0.9 的便利店内容、`maplebirch >=2.0.0` 依赖、`guide/opt-tip.png` 和 `convenience-store.png` 没有被合并删除。
5. 打包前扫描本次修改的界面文案与注释，不引入 Emoji。使用 `python 1.打包.py` 创建模组 ZIP，校验 ZIP 根目录有 `boot.json`，且其中全部资源引用存在。发布包不要包含测试脚本和临时 `copy` 文件。

## 网站部署，不得遗漏

只有修改网站、在线索引、身份表、README 代理或 Worker 接口且用户要求上线时，才进入网站部署流程。先在独立的 `dolmod-site` 目录执行 `npm test`、`npm run build`，然后依次部署并验证三个目标：

1. Cloudflare Pages：`npx wrangler pages deploy dist --project-name dolmod-catalog-pages`，验收 `https://dolmod-catalog-pages.pages.dev`。
2. Sites 镜像：按该仓库 `.openai/hosting.json` 的现有项目发布，不新建站点；验收 `https://dolmod-catalog.johnliao935.chatgpt.site`。
3. Cloudflare Worker：`npx wrangler deploy`，验收 `/health`、`/release-index.json` 及本次修改的 README/图片接口。

网站部署与模组 ZIP 是独立交付物。没有实际部署成功及线上请求验证，就不能声称网站已上线；不要把令牌或凭据提交到仓库。
