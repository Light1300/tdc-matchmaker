import { loginRequest } from './api'

const TOKEN_KEY = 'tdc_token'
const USER_KEY = 'tdc_user'

export const login = async (
  email,
  password
) => {
  try {
    const data = await loginRequest(email, password)

    localStorage.setItem(
      TOKEN_KEY,
      data.token
    )

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(data.user)
    )

    return {
      success: true,
      user: data.user,
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
    }
  }
}

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY)

  return user
    ? JSON.parse(user)
    : null
}

export const isAuthenticated = () => {
  return !!localStorage.getItem(TOKEN_KEY)
}