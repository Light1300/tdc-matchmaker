/**
 * server/seed.js
 * Run once: node seed.js
 * Reads client/src/data/profiles.json and upserts all into MongoDB
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import mongoose from 'mongoose'
import Profile from './models/Profile.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const uri = process.env.MONGO_URI
if (!uri) { console.error('MONGO_URI not set'); process.exit(1) }

const raw = readFileSync(
  path.resolve(__dirname, '../client/src/data/profiles.json'),
  'utf-8'
)
const profiles = Array.isArray(JSON.parse(raw))
  ? JSON.parse(raw)
  : Object.values(JSON.parse(raw))

await mongoose.connect(uri)
console.log('[seed] ✅ Connected to MongoDB')

let inserted = 0, updated = 0

for (const p of profiles) {
  const result = await Profile.findOneAndUpdate(
    { id: p.id },
    p,
    { upsert: true, new: true }
  )
  result.isNew ? inserted++ : updated++
}

console.log(`[seed] ✅ Done — ${inserted} inserted, ${updated} updated`)
await mongoose.disconnect()