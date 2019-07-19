const app = require('../src/app');

const API_TOKEN = process.env.API_TOKEN;
const id = 'dbfcf124-8d9a-4761-a9eb-ce47df287fe2';

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
  it('should fail with missing siteName', () => {
    return supertest(app)
      .post('/bookmarks')
      .send({
        link: 'https://www.thinkful.com'
      })
      .set('Authorization', `bearer ${API_TOKEN}`)
      .expect(400, 'Site Name Required');
  });

  it('should fail with missing link', () => {
    return supertest(app)
      .post('/bookmarks')
      .send({
        siteName: 'Thinkful'
      })
      .set('Authorization', `bearer ${API_TOKEN}`)
      .expect(400, 'Link Required');

  });

  it('should add a bookmark to the array', () => {
    return supertest(app)
      .post('/bookmarks')
      .send({
        siteName: 'Thinkful',
        link: 'https://www.thinkful.com'
      })
      .set('Authorization', `bearer ${API_TOKEN}`)
      .expect(201);
  });
});

describe('GET /bookmarks/:id', () => {
  it('should fail when given an id that doesn\'t exist', () => {
    return supertest(app)
      .get('/bookmarks/fail')
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
      'id',
      'siteName',
      'link'
    );
  });
});

describe('DELETE /bookmarks/:id', () => {
  it('should return 404 on nonexistant id', () => {
    return supertest(app)
      .delete('/bookmarks/fail')
      .set('Authorization', `bearer ${API_TOKEN}`)
      .expect(404, '404 Not Found');
  });

  it('should delete the bookmark with the matching id', async () => {
    await supertest(app)
      .delete(`/bookmarks/${id}`)
      .set('Authorization', `bearer ${API_TOKEN}`);
      
    return supertest(app)
      .get(`/bookmarks/${id}`)
      .set('Authorization', `bearer ${API_TOKEN}`)
      .expect(404, '404 Not Found');
  });
});