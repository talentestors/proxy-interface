# Interface proxy

这个项目用于接口代理转发。

> 使用技术 `koa + koa router + koa cors + koa bodyparser + axios` 。
> netlify 边缘函数。

项目基于 <https://github.com/Dedicatus546/cors-server.git> 修改。

[![Netlify Status](https://api.netlify.com/api/v1/badges/dd25daa3-d576-4164-9bb3-f3748a91df81/deploy-status)](https://app.netlify.com/sites/gitalk-stazxr/deploys)

## 已实现功能

- [x] [`github.com/login/oauth/access_token`](#cors-server) 接口转发。
- [x] [`rsshub.app`](#rsshub) 接口转发。

部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/talentestors/proxy-interface)

## cors-server

这个项目主要解决国内的 `https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token` 接口被墙导致 `gitalk` 无法获取 `token` 问题。

借助 `vercel` 部署服务来进行接口转发。

我个人部署了服务，地址为：`https://gitalk-stazxr.netlify.app/` 。

如果不想折腾，只需把配置下的 `proxy` 改为 `https://gitalk-stazxr.netlify.app/github_access_token` 即可，如下。

![config](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261450438.avif)

如果不放心，可以 `fork` 该项目然后自己注册 `vercel` 进行部署。

相关帖子：[解决 Gitalk 无法获取 Github Token 问题](https://prohibitorum.top/7cc2c97a15b4.html) 。

使用技术 `koa + koa router + koa cors + koa bodyparser + axios` 。

### 部署支持

- [x] `vercel`
- [x] `netlify`
- [x] `docker`

#### 2022-10-22

目前已支持 `netlify` ，详情请进上面的相关帖子查看即可。

目前我个人部署有两个可用接口：

- `vercel`: `https://vercel.prohibitorum.top/github_access_token`
- `netlify`: `https://gitalk-stazxr.netlify.app/github_access_token`

#### 2023-08-13

已支持 Docker 容器方式部署，不过这种方式适合你自己有服务器的情况。

感谢 [@Jorbenzhu](https://github.com/jorben) 提供的 Dockerfile 文件。

镜像已经提交到 DockerHub ，可以使用以下命令来拉取镜像。

```bash
docker pull dedicatus545/github-cors-server:1.0.0
```

然后使用以下命令启动镜像

```bash
docker run -d --name cors-server -p8080:9999 dedicatus545/github-cors-server:1.0.0
```

这里容器内部是 `9999` 端口，绑定主机的 `8080` 端口，这里可以根据你的服务器端口占用情况进行动态修改。

## rsshub

这个项目主要解决 <rsshub.app> 接口国内无法访问的问题。

rsshub文档：[rsshub.app](https://docs.rsshub.app/) || [rsshub.app](https://rsshub.netlify.app/)(国内可访问)

### 部署支持

- [x] `vercel`
- [x] `netlify`
- [ ] `docker` (未知)