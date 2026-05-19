import request from 'supertest';
import app from '../src/server';

const createToken = (id: number, role: string) => 
  Buffer.from(JSON.stringify({ id, role })).toString('base64');

describe('RBAC & IDOR Security Test Suite', () => {
  
  // 1. Authentication Layer Tests
  it('should return 401 if Authorization header is missing', async () => {
    const res = await request(app).get('/articles/1');
    expect(res.status).toBe(401);
  });

  it('should return 401 if token is blacklisted or invalid', async () => {
    const res = await request(app).get('/articles/1').set('Authorization', 'Bearer invalid-token-test');
    expect(res.status).toBe(401);
  });

  // 2. Global Admin & Editor Capabilities
  it('allows admin to read any article regardless of ownership or status', async () => {
    const token = createToken(1, 'admin');
    const res = await request(app).get('/articles/2').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('allows editor to read any article', async () => {
    const token = createToken(4, 'editor');
    const res = await request(app).get('/articles/2').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // 3. Readers Restrictions
  it('allows reader to see public articles', async () => {
    const token = createToken(5, 'reader');
    const res = await request(app).get('/articles/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('blocks reader from accessing drafts (Privilege Escalation Protect)', async () => {
    const token = createToken(5, 'reader');
    const res = await request(app).get('/articles/2').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  // 4. Author Constraints & IDOR Defenses
  it('allows author to view their own draft', async () => {
    const token = createToken(2, 'author');
    const res = await request(app).get('/articles/2').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('blocks author from accessing another users draft (IDOR Protect)', async () => {
    const token = createToken(2, 'author');
    const res = await request(app).get('/articles/3').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  // 5. Destructive Operations & Deletion Policies
  it('allows admin to delete any article', async () => {
    const token = createToken(1, 'admin');
    const res = await request(app).delete('/articles/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('allows author to delete their own draft', async () => {
    const token = createToken(2, 'author');
    const res = await request(app).delete('/articles/2').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('blocks author from deleting another users draft', async () => {
    const token = createToken(2, 'author');
    const res = await request(app).delete('/articles/3').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
