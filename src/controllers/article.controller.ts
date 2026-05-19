import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { securityLogger } from '../middlewares/logger.middleware';

interface Article {
  id: number;
  title: string;
  isDraft: boolean;
  authorId: number;
}

export const articlesDb: Article[] = [
  { id: 1, title: 'Public News', isDraft: false, authorId: 2 },
  { id: 2, title: 'Author Secrets', isDraft: true, authorId: 2 },
  { id: 3, title: 'Editor Draft', isDraft: true, authorId: 3 }
];

export const getArticle = (req: AuthenticatedRequest, res: Response) => {
  const articleId = parseInt(req.params.id);
  const article = articlesDb.find(a => a.id === articleId);

  if (!article) return res.status(404).json({ error: 'Not found' });

  if ((req as any).requiresOwnershipCheck && article.authorId !== req.user?.id) {
    securityLogger('IDOR_ATTEMPT', req, `User tried to access forbidden resource ID ${articleId}`);
    return res.status(403).json({ error: 'Forbidden: You do not own this resource' });
  }

  if (article.isDraft && req.user?.role === 'reader') {
    securityLogger('PRIVILEGE_ESCALATION_ATTEMPT', req, `Reader tried to read draft ID ${articleId}`);
    return res.status(403).json({ error: 'Forbidden: Drafts are restricted' });
  }

  res.json(article);
};

export const deleteArticle = (req: AuthenticatedRequest, res: Response) => {
  const articleId = parseInt(req.params.id);
  const article = articlesDb.find(a => a.id === articleId);

  if (!article) return res.status(404).json({ error: 'Not found' });

  if ((req as any).requiresOwnershipCheck) {
    if (article.authorId !== req.user?.id) {
      securityLogger('IDOR_DELETE_ATTEMPT', req, `User tried to delete asset ID ${articleId}`);
      return res.status(403).json({ error: 'Forbidden: Ownership verification failed' });
    }
    if (!article.isDraft) {
      securityLogger('BUSINESS_RULE_VIOLATION', req, `Author tried to delete published asset ID ${articleId}`);
      return res.status(403).json({ error: 'Forbidden: Authors can only delete drafts' });
    }
  }

  return res.json({ message: 'Deleted successfully' });
};
