const express = require('express')
const crypto = require('node:crypto')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')
const app = express()

const PORT = process.env.PORT ?? 1234

app.disable('x-powered-by')

app.use(express.json())

// Todos los recursos que sean MOVIES se identifican con /movies
// Endpoint: Es un path en el que teneemos un recurso
const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://example.com'
]
// metodos normales: GET,HEAD,POST
// metodos complejos: PUT,PATCH,DELETE

// CORS PRE-FLIGHT
// OPTIONS

app.get('/movies', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    // Si el origen no está en la lista de permitidos, devuelve un 403 Forbidden
    res.header('Access-Control-Allow-Origin', origin)
  }
  // Esto es para que cualquier cliente pueda acceder a esta API,
  // en lugar de estar restringido a un dominio específico, o sea
  // que todos los origeness que no sean nuestro propio origen, estan permitidos

  const { genre } = req.query
  // Si no hay query params para el genre, devuelve todos los movies
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
      // movie => movie.genre.includes(genre)
    )
    return res.json(filteredMovies)
  }
  return res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' })
  }
  res.json(movie)
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    // 400 significa una bad request, osea que el cliente ha hecho algo para que se cometa este error
    // 422 Unprocessable Entity el servidor ha entendido la req pero la sintaxis del recurso que se queria
    // crear no se podia crear porque habai alguna validacion que no era correcta
    res.status(400).json({ error: JSON.parse((result.error.message)) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  // Esto no seria REST porque estamos guardando el estado de la app en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie) // actualizar cache del cliente
}
)

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    // Si el origen no está en la lista de permitidos, devuelve un 403 Forbidden
    res.header('Access-Control-Allow-Origin', origin)
  }
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)
  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  if (!result.success) {
    res.status(400).json({ error: JSON.parse((result.error.message)) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie
  return res.json(updateMovie)
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH')
  }
  res.send(200)
})

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`)
})

// Idempotencia: Propiedad de realizar una accion determinada
// varias veces y aun asi conseguir el mismo resultado que se
// obtendria al hacerlo una ves
