const z = require('zod')

const movieSchema = z.object({
  title: z.string({
    invalid_type_error: 'Movie title must be a String',
    required_error: 'Movie title is required'
  }),
  year: z.number().int().min(1900).max(2024),
  duration: z.number().int().positive(),
  rate: z.number().min(0).max(10).default(5),
  poster: z.string().url({
    invalid_type_error: 'Movie poster must be a URL',
    required_error: 'Movie poster is required'
  }),
  genre: z.array(
    z.enum(['Action', 'Drama', 'Crime', 'Adventure', 'Sci-Fi', 'Romance', 'Animation', 'Biography', 'Fantasy']),
    {
      invalid_type_error: 'Movie genre must be a valid genre',
      required_error: 'Movie genre is required'
    }
  )
})

function validateMovie (input) {
  return movieSchema.safeParse(input)
}

function validatePartialMovie (input) {
  // Partial lo que es que todos y cada una de las propiedades que tenemos las van a volver opcionales
  // De forma que si no esta no pasa nada, pero si esta la valida como se supone que la tiene que validar
  return movieSchema.partial().safeParse(input)
}

module.exports = {
  validateMovie,
  validatePartialMovie
}
