import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connect = async () => {
  const uri = process.env.MONGO_URI

  console.log('[MongoDB] URI exists:', !!uri)

  if (!uri) {
    console.error('[MongoDB] MONGO_URI not set in .env')
    process.exit(1)
  }

  try {
    await mongoose.connect(uri)
    console.log('[MongoDB] Connected ::::', mongoose.connection.host)
  } catch (err) {
    console.error('[MongoDB] Connection failed ::::::',  err.message)
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected ::: ')
  })
}

export default connect