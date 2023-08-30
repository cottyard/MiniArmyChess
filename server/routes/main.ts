import express from 'express'
import controller from '../controllers/game'
const router = express.Router()

router.get('/hall/:user', controller.get_hall)
router.get('/session/:id', controller.get_session)
router.get('/session/:id/game', controller.get_game)

router.post('/hall/:user/challenge', controller.send_challenge)
router.post('/hall/:user/accept', controller.accept_challenge)
router.post('/session/:id/game', controller.submit_move)

export default router