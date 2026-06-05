import { Router } from 'express'
import Profile from '../models/Profile.js'

const router = Router()

// GET all profiles 
router.get('/', async (req, res) => {
  const { gender, status, search } = req.query

  const filter = {}
  if (gender && gender !== 'All') filter.gender = gender
  if (status && status !== 'All') filter.status = status
  if (search) {
    filter.$or = [
      { firstName:   { $regex: search, $options: 'i' } },
      { lastName:    { $regex: search, $options: 'i' } },
      { city:        { $regex: search, $options: 'i' } },
      { designation: { $regex: search, $options: 'i' } },
      { company:     { $regex: search, $options: 'i' } },
    ]
  }

  try {
    const profiles = await Profile.find(filter).lean()
    console.log(`[profiles] GET /api/profiles → ${profiles.length} results`)
    res.json(profiles)
  } catch (err) {
    console.error('[profiles] fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch profiles' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ id: req.params.id }).lean()
    if (!profile) return res.status(404).json({ error: 'Profile not found' })
    console.log(`[profiles] GET /api/profiles/${req.params.id} → ${profile.firstName}`)
    res.json(profile)
  } catch (err) {
    console.error('[profiles] fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

router.post('/', async (req, res) => {
  try {
    const profile = await Profile.create(req.body)
    console.log(`[profiles] POST → created ${profile.id}`)
    res.status(201).json(profile)
  } catch (err) {
    console.error('[profiles] create error:', err.message)
    res.status(500).json({ error: 'Failed to create profile', detail: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    )
    if (!profile) return res.status(404).json({ error: 'Profile not found' })
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' })
  }
})
export default router