import express from 'express';
import { authenticate, authorize } from './middlewares/auth.middleware';
import { getArticle, deleteArticle } from './controllers/article.controller';

const app = express();
app.use(express.json());

app.get('/articles/:id', authenticate, authorize('article:read_all', 'article:read_own'), getArticle);
app.delete('/articles/:id', authenticate, authorize('article:delete_all', 'article:delete_own_draft'), deleteArticle);

export default app;
