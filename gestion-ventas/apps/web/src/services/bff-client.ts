import axios from 'axios'

const bff = axios.create({
  baseURL: process.env.BFF_URL || 'http://localhost:3000/api',
  timeout: 5000,
})

export default bff
