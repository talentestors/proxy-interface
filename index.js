const Koa = require("koa");
const KoaCors = require("@koa/cors");
const KoaRouter = require("@koa/router");
const KoaBodyParser = require("koa-bodyparser");
const axios = require("axios");
const { createProxyMiddleware } = require("http-proxy-middleware");
const koa2Connect = require("koa2-connect");
const zlib = require("zlib");

const app = new Koa();
const router = new KoaRouter();

const targetUrl = process.env.TARGET_URL || "https://api.x.ai/v1";

// 辅助函数：直接从请求中获取新的基础网址
function getNewBaseUrl(req) {
  return `https://${req.headers.host}`;
}

// 修改响应体的函数（整合自 edge_functions 中的 Express proxy 逻辑）
function modifyResponseBody(proxyRes, req, res) {
  const headers = Object.assign({}, proxyRes.headers);
  if (headers.location) {
    headers.location = headers.location.replace(
      new RegExp(targetUrl, "g"),
      getNewBaseUrl(req)
    );
  }
  delete headers["content-length"];

  const contentType = headers["content-type"] || "";
  const isText =
    contentType.includes("text") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    contentType.includes("javascript") ||
    contentType.includes("css");

  const isGrokApi =
    req.url.includes("/chat/completions") ||
    req.url.includes("/completions") ||
    (contentType.includes("json") &&
      (req.url.includes("/v1/") || req.url.includes("/api/")));

  const isStreamingResponse =
    headers["transfer-encoding"] === "chunked" ||
    contentType.includes("text/event-stream") ||
    (req.query && req.query.stream === "true");

  if (isGrokApi) {
    console.log(
      `[Grok API] 检测到 API 请求: ${req.url}, 内容类型: ${contentType}, 是否流式: ${isStreamingResponse}`
    );
  }

  if (!isText) {
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
    return;
  }

  if (isGrokApi && isStreamingResponse) {
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
    return;
  }

  const encoding = headers["content-encoding"];
  if (encoding === "gzip" || encoding === "deflate" || encoding === "br") {
    if (isGrokApi) {
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
      return;
    }
    const chunks = [];
    proxyRes.on("data", (chunk) => {
      chunks.push(chunk);
    });
    proxyRes.on("end", () => {
      const bodyBuffer = Buffer.concat(chunks);
      const decompressFunc =
        encoding === "gzip"
          ? zlib.gunzip
          : encoding === "deflate"
          ? zlib.inflate
          : zlib.brotliDecompress;
      decompressFunc(bodyBuffer, (err, decodedBuffer) => {
        if (err) {
          console.error(`${encoding} decompression error:`, err);
          res.writeHead(proxyRes.statusCode, headers);
          return res.end(bodyBuffer);
        }
        let bodyText = decodedBuffer.toString("utf8");
        bodyText = bodyText.replace(
          new RegExp(targetUrl, "g"),
          getNewBaseUrl(req)
        );
        let modifiedBuffer = Buffer.from(bodyText, "utf8");
        const compressFunc =
          encoding === "gzip"
            ? zlib.gzip
            : encoding === "deflate"
            ? zlib.deflate
            : zlib.brotliCompress;
        compressFunc(modifiedBuffer, (err, compressedBuffer) => {
          if (err) {
            console.error(`${encoding} compression error:`, err);
            res.writeHead(proxyRes.statusCode, headers);
            return res.end(modifiedBuffer);
          }
          res.writeHead(proxyRes.statusCode, headers);
          res.end(compressedBuffer);
        });
      });
    });
  } else {
    res.writeHead(proxyRes.statusCode, headers);
    if (isGrokApi) {
      proxyRes.pipe(res);
      return;
    }
    let remainingChunk = "";
    proxyRes.on("data", (chunk) => {
      const chunkText = remainingChunk + chunk.toString("utf8");
      const lastIndex = chunkText.lastIndexOf(targetUrl);
      if (lastIndex === -1) {
        const modifiedChunk = chunkText.replace(
          new RegExp(targetUrl, "g"),
          getNewBaseUrl(req)
        );
        res.write(modifiedChunk);
        remainingChunk = "";
      } else {
        const safeLength = lastIndex;
        const safeChunk = chunkText.substring(0, safeLength);
        const modifiedChunk = safeChunk.replace(
          new RegExp(targetUrl, "g"),
          getNewBaseUrl(req)
        );
        res.write(modifiedChunk);
        remainingChunk = chunkText.substring(safeLength);
      }
    });
    proxyRes.on("end", () => {
      if (remainingChunk) {
        const modifiedChunk = remainingChunk.replace(
          new RegExp(targetUrl, "g"),
          getNewBaseUrl(req)
        );
        res.write(modifiedChunk);
      }
      res.end();
    });
  }
  proxyRes.on("error", (err) => {
    console.error("Proxy response error:", err);
    res.end();
  });
}

// ===============================
// Koa 原有路由与功能
// ===============================

router.post("/github_access_token", async (ctx, next) => {
  const reqBody = ctx.request.body;
  const resProxy = await axios.post(
    "https://github.com/login/oauth/access_token",
    reqBody
  );
  const params = new URLSearchParams(resProxy.data);
  ctx.body = Array.from(params.entries()).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
  await next();
});

router.get(["/rsshub/", /\/rsshub\/.*\.png/], async (ctx, next) => {
  const reqBody = ctx.request.body;
  reqBody.referrer = "no-referrer";
  const resProxy = await axios.get(
    "https://rsshub.netlify.app/img/logo.png",
    reqBody
  );
  ctx.body = resProxy.data;
  await next();
});

router.get(["/rsshub", /\/rsshub\/.*/], async (ctx, next) => {
  const reqBody = ctx.request.body;
  const url = ctx.request.url.replace("/rsshub", "");
  const resProxy = await axios.get("https://rsshub.app" + url, reqBody);
  console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
  let data = resProxy.data.replace(
    /https:\/\/rsshub.app/g,
    `https://rsshub.netlify.app`
  );
  data = data.replace(/"\/(.*?)"(.*?)/g, `"https://rsshub.netlify.app/$1"$2`);
  ctx.body = data;
  await next();
});

router.get("/", async (ctx, next) => {
  ctx.body = "a cors proxy server!";
  await next();
});

// ===============================
// 集成 Express proxy 的逻辑
// ===============================

// 单独处理 wp-login.php（特殊登录跳转处理）
router.all("/wp-login.php", async (ctx, next) => {
  await koa2Connect(
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      selfHandleResponse: true,
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader("accept-encoding", "identity");
      },
      onProxyRes: (proxyRes, req, res) => {
        if (req.url.includes("action=postpass")) {
          const referer = req.headers.referer || getNewBaseUrl(req);
          let setCookie = proxyRes.headers["set-cookie"];
          if (setCookie) {
            if (!Array.isArray(setCookie)) {
              setCookie = [setCookie];
            }
            setCookie = setCookie.map((cookie) =>
              cookie.replace(/;?\s*domain=[^;]+/i, "")
            );
          }
          const headers = {
            Location: referer,
            "Content-Type": "text/html",
          };
          if (setCookie) {
            headers["Set-Cookie"] = setCookie;
          }
          res.writeHead(302, headers);
          res.end(`<html>
  <head>
    <meta http-equiv="refresh" content="0;url=${referer}">
  </head>
  <body>验证成功，正在重定向...</body>
</html>`);
        } else {
          const headers = Object.assign({}, proxyRes.headers);
          if (headers.location) {
            headers.location = headers.location.replace(
              new RegExp(targetUrl, "g"),
              getNewBaseUrl(req)
            );
          }
          delete headers["content-length"];
          res.writeHead(proxyRes.statusCode, headers);
          proxyRes.pipe(res);
        }
      },
    })
  )(ctx, next);
});

// 通用代理（其他请求走代理逻辑），挂载至 /proxy 路径
router.all("/proxy/(.*)", async (ctx, next) => {
  await koa2Connect(
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      selfHandleResponse: true,
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader("accept-encoding", "identity");
      },
      onProxyRes: modifyResponseBody,
    })
  )(ctx, next);
});

// ===============================
// 启动服务
// ===============================
app.use(KoaCors());
app.use(KoaBodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(9999, () => {
  console.log("cors-server success!");
  console.log("Server is running at http://localhost:9999");
  console.log("Proxy target URL:", targetUrl);
  console.log("Use /proxy to access the proxy server.");
  console.log("Use /github_access_token to get GitHub access token.");
  console.log("Use /rsshub to access RSSHub.");
  console.log("Use /wp-login.php to access WordPress login.");
  console.log("Use / to access the home page.");
});

module.exports = app;
