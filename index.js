const Koa = require("koa");
const KoaCors = require("@koa/cors");
const KoaRouter = require("@koa/router");
const KoaBodyParser = require("koa-bodyparser");
const axios = require("axios");

const app = new Koa();
const router = new KoaRouter();

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
  const res = await axios.get("https://rsshub.netlify.app/img/logo.png", reqBody)
  ctx.body = res.data;
  await next();
});

router.get(["/rsshub", /\/rsshub\/.*/], async (ctx, next) => {
  const reqBody = ctx.request.body;
  const url = ctx.request.url.replace("/rsshub", "");
  const res = await axios.get("https://rsshub.app" + url, reqBody);
  console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
  res.data = res.data.replace(/https:\/\/rsshub.app/g,`http://${ctx.request.host}/rsshub`);
  // replace example: "/logo.png" to "http://localhost:9999/rsshub/logo.png"
  res.data = res.data.replace(/"\/(.*?)"(.*?)/g,`"http://${ctx.request.host}/rsshub/$1"$2`);
  ctx.body = res.data;
  await next();
});

router.get('/', async (ctx, next) => {
  ctx.body = 'a cors proxy server!';
  await next();
})

app.use(KoaCors());
app.use(KoaBodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(9999, () => {
  console.log("cors-server success!");
});
