const Koa = require("koa");
const KoaCors = require("@koa/cors");
const KoaRouter = require("@koa/router");
const proxy = require("koa-proxies");
const axios = require("axios");

const app = new Koa();
const router = new KoaRouter();

// Gemini 反向代理路由
router.all(
  "/gemini_proxy/(.*)",
  proxy("/gemini_proxy", {
    target: "https://generativelanguage.googleapis.com",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/gemini_proxy/, ""),
    logs: true,
  })
);

router.post("/github_access_token", async (ctx, next) => {
  const reqBody = ctx.request.body;
  const res = await axios.post(
    "https://github.com/login/oauth/access_token",
    reqBody
  );
  const params = new URLSearchParams(res.data);
  ctx.body = Array.from(params.entries()).reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
  await next();
});

router.get(["/rsshub/", /\/rsshub\/.*\.png/], async (ctx, next) => {
  const reqBody = ctx.request.body;
  reqBody.referrer = "no-referrer";
  const res = await axios.get(
    "https://rsshub.netlify.app/img/logo.png",
    reqBody
  );
  ctx.body = res.data;
  await next();
});

router.get(["/rsshub", /\/rsshub\/.*/], async (ctx, next) => {
  const reqBody = ctx.request.body;
  const url = ctx.request.url.replace("/rsshub", "");
  const res = await axios.get("https://rsshub.app" + url, reqBody);
  console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
  res.data = res.data.replace(
    /https:\/\/rsshub.app/g,
    `https://rsshub.netlify.app`
  );
  // replace example: "./logo.png" || "/logo.png" to "./rsshub/logo.png"
  res.data = res.data.replace(
    /(src=['"])(\.\/|\/)?(logo\.png)(['"])/g,
    `$1https://rsshub.netlify.app/$3$4`
  );
  ctx.body = res.data;
  await next();
});

router.get("/", async (ctx, next) => {
  ctx.body = "a cors proxy server!";
  await next();
});

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

app.use(KoaCors());
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Gemini Proxy URL: http://localhost:${PORT}/gemini_proxy`);
  console.log(`RSSHub Proxy URL: http://localhost:${PORT}/rsshub`);
  console.log(`GitHub OAuth URL: http://localhost:${PORT}/github_access_token`);
});
