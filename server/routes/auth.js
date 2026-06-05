import { Router } from 'express'
import User from '../models/User.js'

const router = Router()


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      })
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    const passwordMatches = password === user.password

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    return res.json({
      success: true,
      token: user._id.toString(),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('[LOGIN]', err)

    return res.status(500).json({
      success: false,
      error: 'Login failed',
    })
  }
})

export default router