import ImageKit from 'imagekit'
import { env } from '../config/env.js'

const imagekit = new ImageKit({
  publicKey: env.imagekit.publicKey,
  privateKey: env.imagekit.privateKey,
  urlEndpoint: env.imagekit.urlEndpoint,
})

export async function getImageKitAuth(req, res) {
  try {
    const params = imagekit.getAuthenticationParameters()
    res.json(params)
  } catch (err) {
    console.error('ImageKit auth error:', err)
    res.status(500).json({ error: 'Failed to generate ImageKit auth parameters' })
  }
}