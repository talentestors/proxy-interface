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
      const reqBody = await request.text();
      const res = await fetch("https://rsshub.app", {
        method: "GET",
        body: reqBody,
        headers: {
          "Content-type": "text/html",
        },
      });
      const text = await res.text();
      console.log("rsshub.app GET res: ", text);
      const params = new URLSearchParams(text);
      const resp = new Response(
        JSON.stringify(
          Array.from(params.entries()).reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {})
        ),
        {
          status: 200,
        }
      );
      resp.headers.set("Access-Control-Allow-Origin", "*");
      resp.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
      resp.headers.set("Access-Control-Max-Age", `${86400 * 30}`);
      return resp;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  return new Response("a cors proxy by netlify!");
}
