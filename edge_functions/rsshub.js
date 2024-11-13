/**
 *
 * @param {Request} request
 * @param {*} context
 */
export default async function (request) {
  if (request.method === "OPTIONS") {
    // 预检请求
    const resp = new Response(null, {
      status: 204,
    });
    resp.headers.set("Access-Control-Allow-Origin", "*");
    resp.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
    resp.headers.set("Access-Control-Max-Age", `${86400 * 30}`);
    return resp;
  }

  if (request.method === "GET") {
    try {
      const url = new URL(request.url);
      let newUrl = url.pathname.replace("/rsshub", "");
      if (newUrl === "/") {
        newUrl = "";
      }
      console.log(`Process ${request.method} ${newUrl}...`);
      let res = await fetch("https://rsshub.app" + newUrl, {
        method: "GET",
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      }).then((res) => res.text());
      if((url == '' || url == '/' || newUrl == '' || newUrl == '/') && res) {
        // replace example: "/logo.png" to "http://localhost:9999/rsshub/logo.png"
        res = res.replace(/"\/(.*?)"(.*?)/g,`"https://rsshub.netlify.app/$1"$2`);
      }
      return new Response(res, {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  return new Response("a cors proxy by netlify!");
}
