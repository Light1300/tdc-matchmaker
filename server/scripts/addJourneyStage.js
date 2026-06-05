import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Profile from '../models/Profile.js'
dotenv.config()

const stages = ['Actively Matching', 'Profile Review', 'On Hold', 'Match Sent', 'Introductions Made']

const pick = arr => arr[Math.floor(Math.random() * arr.length)]

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  const profiles = await Profile.find({})
  for (const p of profiles) {
    p.journeyStage = pick(stages)
    await p.save()
  }
  console.log(`Updated ${profiles.length} profiles with journeyStage`)
  await mongoose.disconnect()
}
run()