/**
 * AI 代理边缘函数 - 将请求转发到各大 AI 服务提供商
 * 
 * @param {Request} request 客户端请求
 * @param {Object} context Netlify 边缘函数上下文
 */
export default async function (request, context) {
  // 配置目标服务端点
  const API_ENDPOINTS = {
    grok: "https://api.x.ai",
    openai: "https://api.openai.com",
    gemini: "https://generativelanguage.googleapis.com",
    claude: "https://api.anthropic.com",
  };

  // 处理预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  try {
    // 获取目标 URL 路径（移除 /ai_proxy 前缀）
    const url = new URL(request.url);
    const targetPath = url.pathname.replace(/^\/ai_proxy/, "");
    
    // 读取请求体以确定模型类型
    let requestBody;
    let modelName;
    
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const clonedRequest = request.clone();
      const contentType = request.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        requestBody = await clonedRequest.json();
        modelName = requestBody.model;
      }
    }
    
    // 如果请求体中没有模型信息，检查查询参数
    if (!modelName) {
      modelName = url.searchParams.get("model");
    }
    
    // 根据模型选择目标 API
    let targetAPI = API_ENDPOINTS.grok; // 默认
    if (modelName) {
      if (modelName.startsWith("grok")) targetAPI = API_ENDPOINTS.grok;
      else if (modelName.startsWith("gemini")) targetAPI = API_ENDPOINTS.gemini;
      else if (modelName.startsWith("claude")) targetAPI = API_ENDPOINTS.claude;
      else targetAPI = API_ENDPOINTS.openai;
    }
    
    // 构建目标 URL
    const targetURL = `${targetAPI}${targetPath}${url.search ? url.search : ""}`;
    
    // 准备请求头
    const headers = new Headers();
    
    // 复制原始请求的授权头
    if (request.headers.has("authorization")) {
      headers.set("Authorization", request.headers.get("authorization"));
    }
    
    // 设置内容类型
    if (request.headers.has("content-type")) {
      headers.set("Content-Type", request.headers.get("content-type"));
    }
    
    // 处理流式请求
    const isStream = requestBody?.stream === true;
    if (isStream) {
      headers.set("Accept", "text/event-stream");
      headers.set("Cache-Control", "no-cache");
    }
    
    // 创建新请求
    const proxyRequest = new Request(targetURL, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" ? await request.clone().arrayBuffer() : undefined,
      redirect: "follow"
    });
    
    // 发送代理请求
    const response = await fetch(proxyRequest);
    
    // 处理响应
    const responseHeaders = new Headers(response.headers);
    
    // 添加 CORS 头
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    
    // 处理流式响应
    if (targetPath.includes("/chat/completions") && isStream) {
      responseHeaders.set("Content-Type", "text/event-stream; charset=utf-8");
      responseHeaders.set("Connection", "keep-alive");
    }
    
    // 返回响应
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error("[Proxy Error]", error);
    
    // 返回错误响应
    return new Response(
      JSON.stringify({ error: "Bad Gateway", message: error.message }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}
