# Interface Proxy

This project is for interface proxy forwarding.

> Technologies used: `koa + koa router + koa cors + koa bodyparser + axios`.
> Netlify edge functions.

The project is modified from <https://github.com/Dedicatus546/cors-server.git>.

[![Netlify Status](https://api.netlify.com/api/v1/badges/dd25daa3-d576-4164-9bb3-f3748a91df81/deploy-status)](https://app.netlify.com/sites/gitalk-stazxr/deploys)

## Implemented Features

- [x] Forwarding of the [`github.com/login/oauth/access_token`](#cors-server) interface.
- [x] Forwarding of the [`rsshub.app`](#rsshub) interface.
- [x] Proxy forwarding for AI models (Grok, OpenAI, Gemini, and Claude).

Deployment

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/talentestors/proxy-interface)

## cors-server

This project forwards the interface `https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token`, solving the issue of `gitalk` being unable to obtain the `token`.

Route: `/github_access_token`

It uses the `vercel` deployment service for interface forwarding.

I personally deployed the service, accessible at: `https://stazxr-proxy-interface.netlify.app`.

If you don't want to deal with it, simply change the `proxy` configuration below to `https://stazxr-proxy-interface.netlify.app/github_access_token`, as shown below.

![config](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/26/202207261450438.avif)

If you're concerned, you can `fork` this project and register for `vercel` to deploy it yourself.

Related post: [Resolving Gitalk's inability to obtain Github Token](https://prohibitorum.top/7cc2c97a15b4.html).

Technologies used: `koa + koa router + koa cors + koa bodyparser + axios`.

### Deployment Support

- [x] `vercel`
- [x] `netlify`
- [x] `docker`

#### 2022-10-22

Netlify is now supported; please refer to the related post above for details.

Currently, I have two available interfaces:

- `vercel`: `https://vercel.prohibitorum.top/github_access_token`
- `netlify`: `https://stazxr-proxy-interface.netlify.app/github_access_token`

#### 2023-08-13

Docker container deployment is now supported, but this method is suitable if you have your own server.

Thanks to [@Jorbenzhu](https://github.com/jorben) for providing the Dockerfile.

The image has been submitted to DockerHub; you can pull the image using the following command:

```bash
docker pull dedicatus545/github-cors-server:1.0.0
```

Then use the following command to start the image:

```bash
docker run -d --name cors-server -p8080:9999 dedicatus545/github-cors-server:1.0.0
```

Here, the internal port of the container is `9999`, bound to the host's port `8080`. You can adjust this based on your server's port availability.

## rsshub

This project will forward requests to <rsshub.app>.

Route: `/rsshub`

Rsshub documentation: [rsshub.app](https://docs.rsshub.app/) || [rsshub.app](https://rsshub.netlify.app/) (accessible in China).

### Deployment Support

- [x] `vercel`
- [x] `netlify`
- [ ] `docker` (unknown)

## AI Models

This project proxies and forwards requests for AI model interfaces.

Route: `/ai_proxy`

### Deployment Support

- [x] `vercel`
- [x] `netlify`
- [ ] `docker` (unknown)
