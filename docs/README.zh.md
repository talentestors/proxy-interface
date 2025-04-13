# 接口代理

前往 [zh-CN](docs/)

该项目旨在进行接口代理转发。

> 使用技术：`koa + koa router + koa cors + koa bodyparser + axios`。
> Netlify 边缘函数。

该项目是对 <https://github.com/Dedicatus546/cors-server.git> 的修改。

[![Netlify 状态](https://api.netlify.com/api/v1/badges/dd25daa3-d576-4164-9bb3-f3748a91df81/deploy-status)](https://app.netlify.com/sites/gitalk-stazxr/deploys)

## 实现的功能

- [x] 对 [`github.com/login/oauth/access_token`](#cors-服务器) 的代理转发。
- [x] 对 [`rsshub.app`](#rsshub) 的代理转发。
- [x] 对 AI 模型（Grok、OpenAI、Gemini 和 Claude）的代理转发。

### 部署

[![部署到 Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/talentestors/proxy-interface)

## CORS 服务器

该项目主要解决 `https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token` 接口在中国被屏蔽的问题，这使得 `gitalk` 无法获取 `token`。

它利用 `vercel` 部署服务进行接口转发。

我个人已在以下地址部署了该服务：`https://stazxr-proxy-interface.netlify.app/`。

如果您不想自己处理，只需将下面的 `proxy` 配置更改为 `https://stazxr-proxy-interface.netlify.app/github_access_token`，如下所示。

![配置](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261450438.avif)

如果您有顾虑，可以 `fork` 该项目并在 `vercel` 上注册以进行自己的部署。

相关帖子：[解决 Gitalk 无法获取 GitHub Token 的问题](https://prohibitorum.top/7cc2c97a15b4.html)。

使用的技术：`koa + koa router + koa cors + koa bodyparser + axios`。

### 部署支持

- [x] `vercel`
- [x] `netlify`
- [x] `docker`

#### 2022-10-22

目前支持 `netlify`。有关详细信息，请参见上面的相关帖子。

我个人已部署两个可用接口：

- `vercel`：`https://vercel.prohibitorum.top/github_access_token`
- `netlify`：`https://stazxr-proxy-interface.netlify.app/github_access_token`

#### 2023-08-13

现在支持 Docker 容器部署，但此方法适合拥有自己服务器的用户。

感谢 [@Jorbenzhu](https://github.com/jorben) 提供 Dockerfile。

该镜像已提交至 DockerHub，您可以使用以下命令拉取镜像：

```bash
docker pull dedicatus545/github-cors-server:1.0.0
```

然后，使用以下命令启动镜像：

```bash
docker run -d --name cors-server -p8080:9999 dedicatus545/github-cors-server:1.0.0
```

这里，容器的内部端口为 `9999`，绑定到主机的 `8080` 端口。您可以根据服务器的端口可用性动态修改此设置。

## RSSHub

该项目主要解决在中国访问 <rsshub.app> 接口的问题。

RSSHub 文档：[rsshub.app](https://docs.rsshub.app/) || [rsshub.app](https://rsshub.netlify.app/)（在中国可访问）。

### 部署支持

- [x] `vercel`
- [x] `netlify`
- [ ] `docker`（未知）
