const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'An error occurred',
        data,
      }
    }

    return data
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    throw error
  }
}

export async function loginUser(username, password) {
  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function registerUser(username, password) {
  return apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}
