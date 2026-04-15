import { NetworkError } from '../errors/NetworkError'
import { NotFoundError } from '../errors/NotFoundError'
import { RateLimitError } from '../errors/RateLimitError'
import { ServerError } from '../errors/ServerError'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { ValidationError } from '../errors/ValidationError'

// Rails attribute names are snake_case (`password_confirmation`); React form
// state uses camelCase (`passwordConfirmation`). This bridges the two at the
// API boundary so ValidationError.fields is camelCase everywhere the UI reads
// from it.
function snakeToCamel(snake) {
  return snake.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
}

// Guards against `errors` being an array-of-strings (the old shape), a plain
// string, or `null`. Only a plain object with at least one key counts as
// field-keyed — otherwise fall through to the generic error path.
function isFieldKeyedErrorsObject(errors) {
  return errors !== null && typeof errors === 'object' && !Array.isArray(errors) && Object.keys(errors).length > 0
}

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

  // fetch() rejects before any response arrives (offline, DNS, CORS preflight
  // blocked). Translate to NetworkError so consumers can distinguish "no
  // internet" from "server said no".
  let response
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new NetworkError()
  }

  // On 401 for an authenticated request, try refreshing the access token once
  // and retry. For unauthenticated requests (login/register), or if the refresh
  // itself fails, we fall through and let the original 401's error body
  // propagate via the `if (!response.ok)` block below — that way the user sees
  // Rails' actual message ("Invalid email or password") instead of a generic
  // client-side "Session expired".
  if (response.status === 401 && hadAccessToken) {
    try {
      const newToken = await refreshAccessToken()
      headers.Authorization = `Bearer ${newToken}`
      response = await fetch(url, { ...options, headers, credentials: 'include' })
    } catch {
      // Refresh failed — fall through. The original 401 response is still
      // assigned to `response` and will throw with Rails' real error below.
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const serverMessage = body.error

    // Rails 422 with a field-keyed errors object becomes a ValidationError.
    // Shape: { errors: { email: ["has already been taken"], ... } }
    // Snake-case attributes are translated to camelCase to match React state.
    if (response.status === 422 && isFieldKeyedErrorsObject(body.errors)) {
      const fields = {}
      for (const [snakeField, messages] of Object.entries(body.errors)) {
        const camelField = snakeToCamel(snakeField)
        fields[camelField] = Array.isArray(messages) ? messages[0] : String(messages)
      }
      const validationError = new ValidationError(fields)
      validationError.status = response.status
      validationError.body = body
      throw validationError
    }

    // Map HTTP status codes to named Error subclasses so consumers can
    // handle each failure mode explicitly (see client/src/errors/). The
    // subclass provides a sensible default message; Rails' body.error
    // overrides it when present.
    if (response.status === 401) throw new UnauthorizedError(serverMessage)
    if (response.status === 404) throw new NotFoundError(serverMessage)
    if (response.status === 429) throw new RateLimitError(serverMessage)
    if (response.status >= 500) throw new ServerError(serverMessage, response.status)

    // Anything else (400, 403, 418...) falls through to a generic Error.
    const error = new Error(serverMessage || `Request failed: ${response.status}`)
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
