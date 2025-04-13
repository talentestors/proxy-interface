const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const zlib = require('zlib');
const app = express();

const targetUrl = process.env.TARGET_URL || 'https://api.x.ai/v1';

// 添加请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  const originalUrl = req.originalUrl;
  
  // 打印请求开始信息
  console.log(`[${new Date().toISOString()}] ${req.method} ${originalUrl} - 开始处理`);
  
  // 响应完成后记录时间
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${originalUrl} - 完成 ${res.statusCode} (${duration}ms)`);
  });
  
  // 记录请求错误
  res.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] ${req.method} ${originalUrl} - 错误:`, error);
  });
  
  next();
});

// 辅助函数：直接从请求中获取新的基础网址
function getNewBaseUrl(req) {
  return `https://${req.headers.host}`;
}

function modifyResponseBody(proxyRes, req, res) {
  // 复制响应头，后续会修改
  const headers = Object.assign({}, proxyRes.headers);
  
  // 更新 location 头（重定向链接）中的网址
  if (headers.location) {
    headers.location = headers.location.replace(new RegExp(targetUrl, 'g'), getNewBaseUrl(req));
  }
  
  // 删除 content-length，因为使用流式传输
  delete headers['content-length'];
  
  // 检查内容类型和请求路径
  const contentType = headers['content-type'] || '';
  const isText = contentType.includes('text') ||
                contentType.includes('json') ||
                contentType.includes('xml') ||
                contentType.includes('javascript') ||
                contentType.includes('css');
  
  // 检查是否为 Grok API 请求（通常包含 '/chat/completions' 或 '/completions' 路径）
  const isGrokApi = req.path.includes('/chat/completions') || 
                    req.path.includes('/completions') || 
                    (contentType.includes('json') && (req.path.includes('/v1/') || req.path.includes('/api/')));
  
  // 对于Grok API，可能需要特殊处理逐渐返回的结果
  const isStreamingResponse = headers['transfer-encoding'] === 'chunked' || 
                             contentType.includes('text/event-stream') ||
                             req.query.stream === 'true';
  
  // 记录 Grok API 请求信息（便于调试）
  if (isGrokApi) {
    console.log(`[Grok API] 检测到 API 请求: ${req.path}, 内容类型: ${contentType}, 是否流式: ${isStreamingResponse}`);
  }
  
  // 对于非文本内容，直接流式传输而不修改
  if (!isText) {
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
    return;
  }
  
  // 对于Grok API的流式输出请求，直接传递不做修改
  if (isGrokApi && isStreamingResponse) {
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
    return;
  }
  
  const encoding = headers['content-encoding'];
  
  // 流式处理逻辑
  if (encoding === 'gzip' || encoding === 'deflate' || encoding === 'br') {
    // 对于压缩内容，我们仍需要完整接收后处理
    // 对于 Grok API，我们直接流式传输压缩内容而不解码和修改
    if (isGrokApi) {
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
      return;
    }
    
    const chunks = [];
    proxyRes.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    proxyRes.on('end', () => {
      const bodyBuffer = Buffer.concat(chunks);
      const decompressFunc = encoding === 'gzip' ? zlib.gunzip :
                             encoding === 'deflate' ? zlib.inflate :
                             zlib.brotliDecompress;
      
      decompressFunc(bodyBuffer, (err, decodedBuffer) => {
        if (err) {
          console.error(`${encoding} decompression error:`, err);
          res.writeHead(proxyRes.statusCode, headers);
          return res.end(bodyBuffer);
        }
        
        let bodyText = decodedBuffer.toString('utf8');
        bodyText = bodyText.replace(new RegExp(targetUrl, 'g'), getNewBaseUrl(req));
        let modifiedBuffer = Buffer.from(bodyText, 'utf8');
        
        const compressFunc = encoding === 'gzip' ? zlib.gzip :
                             encoding === 'deflate' ? zlib.deflate :
                             zlib.brotliCompress;
        
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
    // 对于未压缩的内容
    res.writeHead(proxyRes.statusCode, headers);
    
    // 对于 Grok API，直接流式传输
    if (isGrokApi) {
      proxyRes.pipe(res);
      return;
    }
    
    // 对于其他文本内容，进行网址替换然后流式传输
    let remainingChunk = '';
    
    proxyRes.on('data', (chunk) => {
      const chunkText = remainingChunk + chunk.toString('utf8');
      // 查找最后一个完整的可能包含目标URL的片段
      const lastIndex = chunkText.lastIndexOf(targetUrl);
      
      if (lastIndex === -1) {
        // 如果没有找到目标URL，直接发送整个片段
        const modifiedChunk = chunkText.replace(new RegExp(targetUrl, 'g'), getNewBaseUrl(req));
        res.write(modifiedChunk);
        remainingChunk = '';
      } else {
        // 如果找到目标URL，计算需要保留的部分
        const safeLength = lastIndex;
        const safeChunk = chunkText.substring(0, safeLength);
        const modifiedChunk = safeChunk.replace(new RegExp(targetUrl, 'g'), getNewBaseUrl(req));
        res.write(modifiedChunk);
        // 保留剩余部分，与下一个chunk合并处理
        remainingChunk = chunkText.substring(safeLength);
      }
    });
    
    proxyRes.on('end', () => {
      // 处理最后剩余的部分
      if (remainingChunk) {
        const modifiedChunk = remainingChunk.replace(new RegExp(targetUrl, 'g'), getNewBaseUrl(req));
        res.write(modifiedChunk);
      }
      res.end();
    });
  }
  
  proxyRes.on('error', (err) => {
    console.error('Proxy response error:', err);
    res.end();
  });
}

// 单独处理 wp-login.php 请求，针对 action=postpass 进行特殊处理，避免空白页面问题
app.use('/wp-login.php', createProxyMiddleware({
  target: targetUrl,
  changeOrigin: true,
  selfHandleResponse: true,
  // 强制请求不使用压缩编码
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('accept-encoding', 'identity');
  },
  onProxyRes: (proxyRes, req, res) => {
    if (req.url.includes('action=postpass')) {
      // 当请求中包含 action=postpass 时，从后端获取 Set-Cookie，
      // 将 cookie 中的 domain 属性去掉（或修改为新域），再返回302重定向到原始页面
      const referer = req.headers.referer || getNewBaseUrl(req);
      let setCookie = proxyRes.headers['set-cookie'];
      if (setCookie) {
        if (!Array.isArray(setCookie)) {
          setCookie = [setCookie];
        }
        // 去除 cookie 中的 domain 属性，确保 cookie 默认作用于当前域
        setCookie = setCookie.map(cookie => cookie.replace(/;?\s*domain=[^;]+/i, ''));
      }
      const headers = {
        'Location': referer,
        'Content-Type': 'text/html'
      };
      if (setCookie) {
        headers['Set-Cookie'] = setCookie;
      }
      res.writeHead(302, headers);
      res.end(`<html>
  <head>
    <meta http-equiv="refresh" content="0;url=${referer}">
  </head>
  <body>验证成功，正在重定向...</body>
</html>`);
    } else {
      // 对于其他情况，直接流式传输响应，而不是等待整个响应加载完成
      const headers = Object.assign({}, proxyRes.headers);
      // 更新 location 头（重定向链接）中的网址
      if (headers.location) {
        headers.location = headers.location.replace(new RegExp(targetUrl, 'g'), getNewBaseUrl(req));
      }
      // 删除 content-length，因为使用流式传输
      delete headers['content-length'];
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    }
  }
}));

// 其他请求使用响应体修改，替换目标网址
app.use('/', createProxyMiddleware({
  target: targetUrl,
  changeOrigin: true,
  selfHandleResponse: true,
  // 强制请求不使用压缩编码
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('accept-encoding', 'identity');
  },
  onProxyRes: modifyResponseBody
}));

// 如果不在 Vercel 环境中，则启动本地服务器
if (!process.env.VERCEL) {
  app.listen(3000, () => {
    console.log('Proxy server is running on http://localhost:3000');
  });
}

// 添加全局错误处理
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  if (!res.headersSent) {
    res.status(500).send('服务器处理请求时发生错误，请稍后再试');
  }
});

module.exports = app;
