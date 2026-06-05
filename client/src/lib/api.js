import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export const loginRequest = async (email, password) => {
  const { data } = await API.post('/api/auth/login', {
    email,
    password,
  })

  return data
}

//  Profiles 
export const fetchProfiles = async () => {
  const { data } = await API.get('/api/profiles')
  return data
}

export const fetchProfile = async (id) => {
  const { data } = await API.get(`/api/profiles/${id}`)
  return data
}

// ── AI / Matching
export const scoreMatch = async (customer, match) => {
  const { data } = await API.post('/api/score-match', { customer, match })
  return data.reason
}

export const sendMatch = async (customer, match) => {
  const { data } = await API.post('/api/send-match', { customer, match })
  return data
}

export const generateIntro = async (customer, match) => {
  const { data } = await API.post('/api/generate-intro', { customer, match })
  return data.intro
}

export const updateProfile = async (mongoId, fields) => {
  const { data } = await API.patch(`/api/profiles/${mongoId}`, fields)
  return data
}