# Interface proxy

English | [简体中文](./docs/README.zh.md)

This project is for interface proxy forwarding.

> Using technologies `koa + koa router + koa cors + koa bodyparser + axios`.
> Netlify edge functions.

The project is modified based on <https://github.com/Dedicatus546/cors-server.git>.

[![Netlify Status](https://api.netlify.com/api/v1/badges/dd25daa3-d576-4164-9bb3-f3748a91df81/deploy-status)](https://app.netlify.com/sites/gitalk-stazxr/deploys)

## Implemented Features

- [x] Interface forwarding for [`github.com/login/oauth/access_token`](#cors-server).
- [x] Interface forwarding for [`rsshub.app`](#rsshub).
- [x] Interface forwarding for [`ai models`](#ai-models).

Deployment

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/talentestors/proxy-interface)

## cors-server

This project forwards the interface `https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token`, solving the problem that `gitalk` cannot obtain the `token`.

Route: `/github_access_token`

Utilizes `vercel` deployment services for interface forwarding.

I deployed the service, and the address is: `https://stazxr-proxy-interface.netlify.app`.

If you don't want to mess around, just change the `proxy` configuration below to `https://stazxr-proxy-interface.netlify.app/github_access_token`, as shown below.

![config](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261450438.avif)

If you're not sure, you can `fork` this project and then register `vercel` for deployment.

Related post: [Solving the issue of Gitalk not being able to obtain the Github Token](https://prohibitorum.top/7cc2c97a15b4.html).

Using technologies `koa + koa router + koa cors + koa bodyparser + axios`.

### Deployment Support

- [x] `vercel`
- [x] `netlify`
- [x] `docker`

#### 2022-10-22

Currently supports `netlify`. For details, please refer to the related post above.

I currently have two available interfaces:

- `vercel`: `https://vercel.prohibitorum.top/github_access_token`
- `netlify`: `https://stazxr-proxy-interface.netlify.app/github_access_token`

#### 2023-08-13

Docker container deployment is now supported, but this method is suitable if you have your server.

Thanks to [@Jorbenzhu](https://github.com/jorben) for providing the Dockerfile.

The image has been submitted to DockerHub, and you can use the following command to pull the image.

```bash
docker pull talentestors/github-proxy-interface:latest
```

Then use the following command to start the image

```bash
docker run -d --name cors-server -p8080:9999 talentestors/github-proxy-interface:latest
```

Here, the container's internal port is `9999`, bound to the host's `8080` port. You can dynamically modify this based on your server's port usage.

## rsshub

This project will forward to <rsshub.app>.

Route: `/rsshub`

rsshub documentation: [rsshub.app](https://docs.rsshub.app/) || [rsshub.app](https://rsshub.netlify.app/) (accessible in China)

### Deployment Support

- [x] `vercel`
- [x] `netlify`
- [ ] `docker`

## AI Models

- Gemini non-openai compatible interface routing: `/gemini_proxy`
- OpenAI routing: `/openai`  
- Grok routing: `/grok`  
- Claude routing: `/claude_proxy`

### Deployment Support

- [x] `vercel`
- [x] `netlify`
- [ ] `docker`
