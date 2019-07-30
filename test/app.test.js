const app = require('../src/app');
const knex = require('knex');

const API_TOKEN = process.env.API_TOKEN;
const id = '1';

describe('Bookmarks Endpoints', function() {
  let db;

  const testBookmarks = [
    {
      bookmark_site: 'Google',
      bookmark_link: 'https://www.google.com',
    },
    {
      bookmark_site: 'Thinkful',
      bookmark_link: 'https://www.thinkful.com',
    },
    {
      bookmark_site: 'Reddit',
      bookmark_link: 'https://www.reddit.com',
    }
  ];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });

    app.set('db', db);
  });

  const table = 'bookmarks';
  after(() => db.destroy());
  afterEach(() => db(table).truncate());
  context('bookmarks has data', () => {
    beforeEach(() => {
      return db(table)
        .insert(testBookmarks);
    });

    describe('GET /', () => {
      it('should reject with 401 on invalid auth token', () => {
        const BAD_TOKEN = 'fail';
        return supertest(app)
          .get('/')
          .set('Authorization', `bearer ${BAD_TOKEN}`)
          .expect(401);
      });

      it('should succeed with valid auth token', () => {
        return supertest(app)
          .get('/')
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(200);
      });
    });

    describe('GET /bookmarks', () => {

      it('should return an array of bookmarks', async () => {
        const res = await supertest(app)
          .get('/bookmarks')
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(200)
          .expect('Content-Type', /json/);

        expect(res.body).to.be.an('array');
      });
    });

    describe('POST /bookmarks', () => {
      it('should fail with missing bookmark_site', () => {
        return supertest(app)
          .post('/bookmarks')
          .send({
            bookmark_link: 'https://www.thinkful.com'
          })
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(400, 'Site Name Required');
      });

      it('should fail with missing link', () => {
        return supertest(app)
          .post('/bookmarks')
          .send({
            bookmark_site: 'Thinkful'
          })
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(400, 'Link Required');

      });

      it('should add a bookmark to the array', () => {
        return supertest(app)
          .post('/bookmarks')
          .send({
            bookmark_site: 'Thinkful',
            bookmark_link: 'https://www.thinkful.com'
          })
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(201);
      });
    });

    describe('ALL /bookmarks/:bookmark_id', () => {
      it('should fail when given an id that is not an number', () => {
        return supertest(app)
          .get('/bookmarks/invalidid')
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(400, 'Invalid Id');
      });
    });

    describe('GET /bookmarks/:bookmark_id', () => {
      it('should fail when given an id that doesn\'t exist', () => {
        return supertest(app)
          .get('/bookmarks/12345')
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(404, '404 Not Found');
      });

      it('should return a bookmark with the matching id', async () => {
        const res = await supertest(app)
          .get(`/bookmarks/${id}`)
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(200);

        expect(res.body).to.be.an('object');
        expect(res.body).to.have.all.keys(
          'bookmark_id',
          'bookmark_site',
          'bookmark_link',
          'bookmark_desc',
          'bookmark_rating'
        );
      });
    });

    describe('DELETE /bookmarks/:bookmark_id', () => {
      it('should return 404 on nonexistant id', () => {
        const badId = '12345';
        return supertest(app)
          .delete(`/bookmarks/${badId}`)
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(404, `Bookmark with id ${badId} not found`);
      });

      it('should delete the bookmark with the matching id', () => {
        return supertest(app)
          .delete(`/bookmarks/${id}`)
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(202);
      });
    });

    describe('PATCH /bookmarks/:bookmark_id',  () => {
      it('should repond 204 and update the article', async () => {
        const res = await supertest(app)
          .get(`/bookmarks/${id}`);
        const currentBookmark = res.body;
        
        const updateInfo = {
          bookmark_site: 'Bing',
          bookmark_link: 'https://www.bing.com'
        };

        const updatedBookmark = {
          bookmark_id: currentBookmark.bookmark_id,
          bookmark_site: updateInfo.bookmark_site,
          bookmark_link: updateInfo.bookmark_link,
          bookmark_desc: currentBookmark.bookmark_desc,
          bookmark_rating: currentBookmark.bookmark_rating
        };
        await supertest(app)
          .patch(`/bookmarks/${id}`)
          .send(updateInfo)
          .set('Authorization', `bearer ${API_TOKEN}`)
          .expect(204);

        const updateRes = await supertest(app)
          .get(`/bookmarks/${id}`);
        const updatedData = updateRes.body;
        expect(updatedData).to.eql(updatedBookmark);
      });
    });
  });
});
