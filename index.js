const Koa = require("koa");
const KoaCors = require("@koa/cors");
const KoaRouter = require("@koa/router");
const proxy = require("koa-proxies");
const http = require("http");
const axios = require("axios");

const app = new Koa();
const router = new KoaRouter();

// 配置目标服务端点
const API_ENDPOINTS = {
  grok: "https://api.x.ai",
  openai: "https://api.openai.com",
  gemini: "https://generativelanguage.googleapis.com",
  claude: "https://api.anthropic.com",
};

// 修改动态代理中间件的创建方式，使用 router 动态匹配目标 URL
const createAiProxy = () =>
  proxy("/ai_proxy", {
    target: API_ENDPOINTS.openai,
    // router 支持函数，动态返回目标
    router: (req) => {
      const model = req.body?.model || req.query.model;
      if (model?.startsWith("grok")) return API_ENDPOINTS.grok;
      if (model?.startsWith("gemini")) return API_ENDPOINTS.gemini;
      if (model?.startsWith("claude")) return API_ENDPOINTS.claude;
      return API_ENDPOINTS.openai; // 默认回退
    },
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/ai_proxy/, ""),
    logs: true,
    events: {
      proxyReq: (proxyReq, req) => {
        // 保留客户端原始请求头
        proxyReq.setHeader("Authorization", req.headers.authorization || "");

        // 流式请求特殊处理
        if (req.body?.stream) {
          proxyReq.setHeader("Accept", "text/event-stream");
          proxyReq.setHeader("Cache-Control", "no-cache");
        }
      },
      proxyRes: (proxyRes, req, res) => {
        // 流式响应头设置
        if (req.url.includes("/chat/completions")) {
          // 修改处：使用 req.url 替换 req.path
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.setHeader("Connection", "keep-alive");
        }
      },
      error: (err, req, res) => {
        console.error("[Proxy Error]", err);
        res.status(502).json({ error: "Bad Gateway" });
      },
    },
  });

// 配置路由
router.all("/ai_proxy/(.*)", createAiProxy());

// GitHub OAuth路由
router.post("/github_access_token", async (ctx) => {
  try {
    const { data } = await axios.post(
      "https://github.com/login/oauth/access_token",
      ctx.request.body,
      { headers: { Accept: "application/json" } }
    );
    ctx.body = data;
  } catch (err) {
    ctx.status = err.response?.status || 500;
    ctx.body = err.response?.data || { error: "OAuth Failed" };
  }
});

// RSS代理路由
router.all(
  "/rsshub/(.*)",
  proxy("/rsshub", {
    target: "https://rsshub.app",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/rsshub/, ""),
    filter: (pathname) => !pathname.endsWith(".png"),
    events: {
      proxyRes: (proxyRes, req, res) => {
        const contentType = proxyRes.headers["content-type"];
        if (contentType?.includes("text/html")) {
          res.setHeader("Content-Type", `${contentType}; charset=utf-8`);
        }
      },
    },
  })
);

// CORS配置
app.use(
  KoaCors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
  })
);

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.expose ? err.message : "Internal Server Error",
      code: err.code,
    };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const PORT = process.env.PORT || 9999;
http.createServer(app.callback()).listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Proxy URL: http://localhost:${PORT}/ai_proxy/`);
  console.log(`RSSHub Proxy URL: http://localhost:${PORT}/rsshub/`);
  console.log(`GitHub OAuth URL: http://localhost:${PORT}/github_access_token`);
});
