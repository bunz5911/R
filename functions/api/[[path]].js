/**
 * Cloudflare Pages Function: API 프록시
 * /api/* 요청을 Render.com 백엔드로 전달
 * 
 * 참고: _redirects 파일을 사용하는 것이 더 간단하지만,
 * 더 세밀한 제어가 필요하면 이 Functions를 사용할 수 있습니다.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // /api/ 경로 제거
  const apiPath = url.pathname.replace(/^\/api\//, '');
  
  // Render.com 백엔드 URL 구성
  const backendUrl = `https://r-6s57.onrender.com/api/${apiPath}${url.search}`;
  
  console.log(`[API Proxy] ${request.method} ${url.pathname} -> ${backendUrl}`);
  
  try {
    // 백엔드로 요청 전달
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'Host': 'r-6s57.onrender.com',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.clone().arrayBuffer() 
        : null,
    });
    
    // 응답 반환
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[API Proxy Error]', error);
    return new Response(
      JSON.stringify({ 
        error: 'API 프록시 오류', 
        message: error.message 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

