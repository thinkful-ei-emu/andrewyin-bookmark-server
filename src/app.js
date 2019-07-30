require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
// const uuid = require('uuid/v4');
const winston = require('winston');

const NODE_ENV = require('./config');
const BookmarksService = require('./bookmarks-service');

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
  .get(async (req, res) => {
    try {
      const db = req.app.get('db');

      const bookmarks = await BookmarksService.getAllBookmarks(db);

      res.json(bookmarks);
    }
    catch (e) {
      console.error(e.message);
    }
  })
  /**
   * POST /bookmarks
   */
  .post(bodyParser, async (req, res) => {
    const db = req.app.get('db');
    const { bookmark_site, bookmark_link, bookmark_desc, bookmark_rating } = req.body;

    if (!bookmark_site) {
      return res.status(400).send('Site Name Required');
    }
    if (!bookmark_link) {
      return res.status(400).send('Link Required');
    }

    const bookmark = {
      bookmark_site,
      bookmark_link
    };

    if (bookmark_desc) Object.assign(bookmark, { bookmark_desc });
    if (bookmark_rating) {
      if (bookmark_rating > 5 || bookmark_rating < 1) return res.status(400).status('Rating must be between 1 and 5.');
      else Object.assign(bookmark, { bookmark_rating });
    }

    try {
      const bookmarks = await BookmarksService.insertBookmarks(db, bookmark);
      res.status(201).json(bookmarks);
    }
    catch (e) {
      throw e;
    }
  });

bookmarkRouter.route('/:bookmark_id')
  .all((req, res, next) => {
    const { bookmark_id } = req.params;
    if (Number.isNaN(parseInt(bookmark_id))) return res.status(400).send('Invalid Id');
    next();
  })
  /**
   * GET /bookmarks/:bookmark_id
   */
  .get(async (req, res) => {
    const db = req.app.get('db');
    const { bookmark_id } = req.params;

    try {
      const bookmark = await BookmarksService.getById(db, bookmark_id);

      if (!bookmark) {
        console.log('no bookmark found');
        return res.status(404).send('404 Not Found');
      }

      res.json(bookmark);
    }
    catch (e) {
      throw e;
    }
  })
  /**
   * DELETE /bookmarks/:bookmark_id
   */
  .delete(async (req, res) => {
    const db = req.app.get('db');
    const { bookmark_id } = req.params;

    try {
      const bookmarks = await BookmarksService.getAllBookmarks(db);
      if (!bookmarks.find(bookmark => bookmark.bookmark_id === parseInt(bookmark_id))) {
        return res.status(404).send(`Bookmark with id ${bookmark_id} not found`);
      }
      else {
        return res.status(202).end();
      }
    }
    catch (e) {
      throw e;
    }
  })
  /**
   * PATCH /bookmarks/:bookmark_id
   */
  .patch(bodyParser, async (req, res, next) => {
    const db = req.app.get('db');
    const { bookmark_id } = req.params;
    const { bookmark_site, bookmark_link, bookmark_desc, bookmark_rating } = req.body;

    try {
      const updatedInfo = {
        bookmark_site,
        bookmark_link,
        bookmark_desc,
        bookmark_rating
      };
      const updatedBookmark = await BookmarksService.updateBookmark(db, bookmark_id, updatedInfo);

      res.status(204).json(updatedBookmark);
      next();
    }
    catch (e) {
      throw e;
    }
  });

module.exports = app;
