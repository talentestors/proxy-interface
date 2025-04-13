# Interface Proxy

Go [zh-CN](docs/)

This project is designed for interface proxy forwarding.

> Technologies used: `koa + koa router + koa cors + koa bodyparser + axios`.
> Netlify edge functions.

The project is a modification of <https://github.com/Dedicatus546/cors-server.git>.

[![Netlify Status](https://api.netlify.com/api/v1/badges/dd25daa3-d576-4164-9bb3-f3748a91df81/deploy-status)](https://app.netlify.com/sites/gitalk-stazxr/deploys)

## Implemented Features

- [x] Proxy forwarding for [`github.com/login/oauth/access_token`](#cors-server).
- [x] Proxy forwarding for [`rsshub.app`](#rsshub).
- [x] Proxy forwarding for AI models (Grok, OpenAI, Gemini, and Claude)

### Deployment

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/talentestors/proxy-interface)

## CORS Server

This project primarily addresses the issue of the `https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token` interface being blocked in China, which prevents `gitalk` from obtaining the `token`.

It utilizes `vercel` deployment services for interface forwarding.

I have personally deployed the service at: `https://stazxr-proxy-interface.netlify.app/`.

If you prefer not to deal with it yourself, simply change the `proxy` configuration below to `https://stazxr-proxy-interface.netlify.app/github_access_token`, as shown below.

![config](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261450438.avif)

If you have concerns, you can `fork` this project and register on `vercel` for your own deployment.

Related post: [Resolving Gitalk's inability to obtain Github Token](https://prohibitorum.top/7cc2c97a15b4.html).

Technologies used: `koa + koa router + koa cors + koa bodyparser + axios`.

### Deployment Support

- [x] `vercel`
- [x] `netlify`
- [x] `docker`

#### 2022-10-22

Currently, `netlify` is supported. For details, please refer to the related post above.

I have personally deployed two available interfaces:

- `vercel`: `https://vercel.prohibitorum.top/github_access_token`
- `netlify`: `https://stazxr-proxy-interface.netlify.app/github_access_token`

#### 2023-08-13

Docker container deployment is now supported, but this method is suitable for those who have their own servers.

Thanks to [@Jorbenzhu](https://github.com/jorben) for providing the Dockerfile.

The image has been submitted to DockerHub, and you can pull the image using the following command:

```bash
docker pull dedicatus545/github-cors-server:1.0.0
```

Then, use the following command to start the image:

```bash
docker run -d --name cors-server -p8080:9999 dedicatus545/github-cors-server:1.0.0
```

Here, the internal port of the container is `9999`, bound to the host's `8080` port. You can modify this dynamically based on your server's port availability.

## RSSHub

This project primarily addresses the issue of accessing the <rsshub.app> interface in China.

RSSHub documentation: [rsshub.app](https://docs.rsshub.app/) || [rsshub.app](https://rsshub.netlify.app/) (accessible in China).

### Deployment Support

- [x] `vercel`
- [x] `netlify`
- [ ] `docker` (unknown)
