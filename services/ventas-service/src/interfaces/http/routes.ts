import express from 'express'
import { createVenta, getVenta } from './controllers/ventas.controller'

const router = express.Router()

router.post('/ventas', createVenta)
router.get('/ventas/:id', getVenta)

export default router
