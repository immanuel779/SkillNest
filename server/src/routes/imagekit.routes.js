import { Router } from 'express'
import { getImageKitAuth } from '../controllers/imagekit.controller.js'

const router = Router()
router.get('/auth', getImageKitAuth)

export default router