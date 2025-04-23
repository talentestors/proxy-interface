/**
 * Openai 代理边缘函数 - 将请求转发到各大 AI 服务提供商
 *
 * @param {Request} request 客户端请求
 * @param {Object} context Netlify 边缘函数上下文
 */
export default async function (request, context) {
  // 处理 CORS 预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 构造目标 URL
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/openai/, "");
  url.host = "api.openai.com";
  url.protocol = "https:";

  // 保留原始请求方法、头和体
  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : undefined,
    redirect: "follow",
  });

  // 发起代理请求
  const response = await fetch(proxyRequest);

  // 复制响应并添加 CORS 头
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  newHeaders.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
