require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const uuid = require('uuid/v4');
const winston = require('winston');

const NODE_ENV = require('./config');
const bookmarks = require('./store');

const app = express();
const bookmarkRouter = express.Router();
const bodyParser = express.json();

// set morgan options
const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

// set up winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use('/bookmarks', bookmarkRouter);
// app.use(express.json());

app.use(function errorHandler(error, req, res, next) {
  let response;

  if (NODE_ENV === 'production') {
    response = {
      error: { message: 'server error' }
    };
  }
  else {
    response = {
      message: error.message,
      error
    };
  }

  res.status(500).json(response);
  next();
});

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  // move to the next middleware
  next();
});

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

bookmarkRouter.route('/')
  /**
   * GET /bookmarks
   */
  .get((req, res) => {
    res.json(bookmarks);
  })
  /**
   * POST /bookmarks
   */
  .post(bodyParser, (req, res) => {
    const { siteName, link } = req.body;

    if (!siteName) {
      return res.status(400).send('Site Name Required');
    }
    if (!link) {
      return res.status(400).send('Link Required');
    }

    bookmarks.push({
      id: uuid(),
      siteName,
      link
    });

    res.status(201).json(bookmarks);
  });

bookmarkRouter.route('/:id')
  /**
   * GET /bookmarks/:id
   */
  .get((req, res) => {
    const { id } = req.params;

    const bookmark = bookmarks.find(bookmark => bookmark.id === id);

    if (!bookmark) return res.status(404).send('404 Not Found');

    res.json(bookmark);
  })
  /**
   * DELETE /bookmarks/:id
   */
  .delete((req, res) => {
    const { id } = req.params;

    // const bookmark = bookmarks.find(bookmark => bookmark.id === id);
    const index = bookmarks.findIndex(bookmark => bookmark.id === id);

    if (index < 0) return res.status(404).send('404 Not Found');

    bookmarks.splice(index, 1);

    res.status(202).send(bookmarks);
  });



module.exports = app;
