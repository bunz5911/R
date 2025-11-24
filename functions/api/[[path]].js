/**
 * Cloudflare Pages Function: API 프록시
 * /api/* 요청을 Render.com 백엔드로 전달
 * 
 * POST 요청의 body를 올바르게 전달하기 위해 Functions 사용
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // /api/ 경로 제거
  const apiPath = url.pathname.replace(/^\/api\//, '');
  
  // Render.com 백엔드 URL 구성
  const backendUrl = `https://r-6s57.onrender.com/api/${apiPath}${url.search}`;
  
  console.log(`[API Proxy] ${request.method} ${url.pathname} -> ${backendUrl}`);
  
  try {
    // 요청 헤더 복사 (Host 헤더 제외)
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      // Host 헤더는 제외 (백엔드의 Host로 대체됨)
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    }
    
    // 요청 body 처리
    let body = null;
    const method = request.method.toUpperCase();
    
    // GET, HEAD, OPTIONS 요청은 body가 없어야 함
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      // request.body가 있으면 사용
      if (request.body) {
        // ReadableStream을 직접 전달
        body = request.body;
        console.log(`[API Proxy] Body 전달 - Method: ${method}, Body 존재: true`);
      } else {
        console.log(`[API Proxy] Body 없음 - Method: ${method}`);
      }
    }
    
    // 백엔드로 요청 전달
    const fetchOptions = {
      method: method,
      headers: headers,
    };
    
    // body가 있으면 추가
    if (body) {
      fetchOptions.body = body;
    }
    
    console.log(`[API Proxy] 백엔드 요청 시작 - URL: ${backendUrl}, Method: ${method}, Body: ${body ? '있음' : '없음'}`);
    
    const response = await fetch(backendUrl, fetchOptions);
    
    console.log(`[API Proxy] 백엔드 응답 수신 - Status: ${response.status}, StatusText: ${response.statusText}`);
    
    // 응답 헤더 복사
    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      // CORS 관련 헤더는 제외하고 나중에 추가
      if (!key.toLowerCase().startsWith('access-control-')) {
        responseHeaders.set(key, value);
      }
    }
    
    // CORS 헤더 추가
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    
    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: responseHeaders,
      });
    }
    
    // 응답 본문 읽기
    let responseBody;
    try {
      responseBody = await response.arrayBuffer();
    } catch (bodyError) {
      console.error('[API Proxy] 응답 본문 읽기 실패:', bodyError);
      // 빈 응답 본문으로 처리
      responseBody = new ArrayBuffer(0);
    }
    
    // 응답 반환
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API Proxy Error]', error);
    console.error('[API Proxy Error] Message:', error.message);
    console.error('[API Proxy Error] Stack:', error.stack);
    console.error('[API Proxy Error] URL:', backendUrl);
    
    // 에러 응답 생성
    const errorResponse = {
      error: 'API 프록시 오류',
      message: error.message,
      url: backendUrl,
      method: request.method,
      path: url.pathname
    };
    
    // 스택 트레이스는 프로덕션에서는 제외 (보안)
    if (error.stack) {
      errorResponse.stack = error.stack;
    }
    
    return new Response(
      JSON.stringify(errorResponse), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

