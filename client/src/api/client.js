let accessToken = null

export function setAccessToken(newAccessToken) {
  accessToken = newAccessToken
}

export function getAccessToken() {
  return accessToken
}

let isRefreshing = false
let refreshQueue = []

function processRefreshQueue(error, token) {
  for (const { resolve, reject } of refreshQueue) {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  }
  refreshQueue = []
}

async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject })
    })
  }

  isRefreshing = true

  try {
    const response = await fetch('/api/v1/token', {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Refresh failed')
    }

    const data = await response.json()
    setAccessToken(data.access_token)
    processRefreshQueue(null, data.access_token)
    return data.access_token
  } catch (error) {
    setAccessToken(null)
    processRefreshQueue(error, null)
    throw error
  } finally {
    isRefreshing = false
  }
}

export async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Snapshot whether this request was sent with an access token. If it wasn't
  // (e.g. the user is logging in), a 401 is a real auth failure, not an
  // expired session — there's nothing to refresh.
  const hadAccessToken = accessToken !== null
  if (hadAccessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  // Remove Content-Type for FormData (browser sets boundary automatically)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  // On 401 for an authenticated request, try refreshing the access token once
  // and retry. For unauthenticated requests (login/register), or if the refresh
  // itself fails, we fall through and let the original 401's error body
  // propagate via the `if (!response.ok)` block below — that way the user sees
  // Rails' actual message ("Invalid email or password") instead of a generic
  // client-side "Session expired".
  if (response.status === 401 && !options._retried && hadAccessToken) {
    try {
      const newToken = await refreshAccessToken()
      headers.Authorization = `Bearer ${newToken}`
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        _retried: true,
      })
    } catch {
      // Refresh failed — fall through. The original 401 response is still
      // assigned to `response` and will throw with Rails' real error below.
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.error || body.errors?.[0] || `Request failed: ${response.status}`)
    error.status = response.status
    error.body = body
    throw error
  }

  // 204 No Content
  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function apiGet(url) {
  return apiFetch(url, { method: 'GET' })
}

export function apiPost(url, body) {
  if (body instanceof FormData) {
    return apiFetch(url, { method: 'POST', body })
  }
  return apiFetch(url, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPatch(url, body) {
  return apiFetch(url, { method: 'PATCH', body: JSON.stringify(body) })
}

export function apiDelete(url) {
  return apiFetch(url, { method: 'DELETE' })
}
