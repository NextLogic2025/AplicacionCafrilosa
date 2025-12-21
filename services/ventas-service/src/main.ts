import express from 'express'
import routes from './interfaces/http/routes'

const app = express()
app.use(express.json())
app.use('/api', routes)

const port = process.env.PORT || 3001
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ventas-service listening on ${port}`)
})
