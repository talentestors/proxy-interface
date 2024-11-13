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
    resp.headers.set("Access-Control-Allow-Origin", "rsshub.app");
    resp.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
    resp.headers.set("Access-Control-Max-Age", `${86400 * 30}`);
    resp.headers.set("Host", "rsshub.app");
    return resp;
  }

  if (request.method === "GET") {
    try {
      const res = await fetch("https://rsshub.app", {
        method: "GET",
        headers: {
          "Content-type": "text/html, charset=utf-8, application/json, application/xml, application/rss+xml, application/atom+xml, application/rdf+xml, application/rss, application/atom, application/rdf",
        },
      });
      return res;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  return new Response("a cors proxy by netlify!");
}
