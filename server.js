import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import endpoints from 'express-list-endpoints'

import booksData from './data/books.json'

const port = process.env.PORT || 8080
const app = express()
const fs = require('file-system')

const ERROR_MSG = {
  status_code: 404,
  error: 'no books found!'
}

const INPUT_ERROR = {
  status_code: 400,
  error: 'invalid input!'
}

const ERROR_PAGE = {
  status_code: 400,
  error: 'Please define a page',
  example: 'books?page=1'
}

app.use(cors())
app.use(bodyParser.json())

const bookDefinition = [
  {
    fieldName: "bookID",
    fieldType: "number"
  },
  {
    fieldName: "title",
    fieldType: "string"
  },
  {
    fieldName: "authors",
    fieldType: "string"
  },
  {
    fieldName: "average_rating",
    fieldType: "number"
  },
  {
    fieldName: "isbn",
    fieldType: "number"
  },
  {
    fieldName: "isbn13",
    fieldType: "number"
  },
  {
    fieldName: "language_code",
    fieldType: "string"
  },
  {
    fieldName: "num_pages",
    fieldType: "number"
  },
  {
    fieldName: "ratings_count",
    fieldType: "number"
  },
  {
    fieldName: "text_reviews_count",
    fieldType: "number"
  }
]

const validateBookInput = (bookDefinition, input) => {
  const result = bookDefinition.map((property) => {
    const test = input[property.fieldName]
    return {
      isValid: typeof test === property.fieldType,
      fieldName: property.fieldName
    }
  })
  return result
}

app.get('/', (req, res) => {
  res.send(endpoints(app))
})

app.get('/books', (req, res) => {
  const page = req.query.page || 0
  const language = req.query.lang
  const otherlanguages = req.query.otherlang
  const sorted = req.query.sorted

  const pageSize = 20
  const startindex = page * pageSize
  const endindex = startindex + pageSize
  const booksPerPage = booksData.slice(startindex, endindex)

  const returnObject = { 
    page_size: pageSize,
    page: page,
    max_pages: parseInt(booksData.length/pageSize),
    num_books: booksPerPage.length, 
    results: booksPerPage 
  }

  if (language) {
    const booksInChosenLang = booksData.filter((item) => item.language_code === language)
    if (booksInChosenLang.length === 0) {
      res.status(404).json(ERROR_MSG)
    } res.json(booksInChosenLang)
  } else if (otherlanguages) {
    const booksInOtherLang = booksData.filter((item) => item.language_code != language)
    if (booksInOtherLang.length === 0) {
      res.status(404).json(ERROR_MSG)
    } res.json(booksInOtherLang)
  } else if (sorted) {
    const sortByNumPages = booksData.sort((a, b) => {
      if (sorted === 'asc') {
        return +a.num_pages - +b.num_pages
      } else if (sorted === 'des') {
        return +b.num_pages - +a.num_pages
      } res.json(sortByNumPages)
    })
  } else res.json(returnObject)
})

app.post('/books', (req, res) => {
  const input = req.body
  const validationResult = validateBookInput(bookDefinition, input)
  const invalids = validationResult.filter((object) => !object.isValid)

  if (invalids.length === 0) {
    const result = JSON.parse(fs.readFileSync('./data/books.json'))
    result.push(input)
    const resultJSON = JSON.stringify(result)
    fs.writeFileSync('./data/books.json', resultJSON)
    res.status(201).json(validationResult)
  } else
    res.status(400).json(INPUT_ERROR)
})

app.get('/books/:book', (req, res) => {
  const book = req.params.book
  const result = booksData.find((item) => item.bookID === +book)
  if (!result) {
    res.status(404).json(ERROR_MSG)
  }
  res.json(result)
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
