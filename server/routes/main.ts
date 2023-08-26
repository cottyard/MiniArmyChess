import express from 'express'
import controller from '../controllers/game'
const router = express.Router()

router.get('/hall/:name', controller.get_hall)
// router.get('/session/:id/status', controller.get_session_status)
// router.get('/game/:id', controller.get_game)

// router.post('/hall/challenge/:id', controller.challenge_player)
// router.post('/hall/accept', controller.accept_challenge)
// router.post('/hall/watch/:id', controller.watch_player)
// router.post('/game/:id/move', controller.submit_move)

export default router