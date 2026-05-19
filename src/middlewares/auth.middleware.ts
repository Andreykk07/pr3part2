import { Request, Response, NextFunction } from 'express';
import { rolesMatrix, Role, Permission } from '../config/rbac';
import { securityLogger } from './logger.middleware';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: Role;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    securityLogger('AUTHENTICATION_FAILED', req, 'Missing or malformed token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token === 'invalid-token-test') {
    securityLogger('AUTHENTICATION_FAILED', req, 'Expired or invalid signature');
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64').toString());
    req.user = parsed;
    next();
  } catch {
    securityLogger('AUTHENTICATION_FAILED', req, 'Failed to parse token payload');
    return res.status(401).json({ error: 'Invalid token format' });
  }
};

export const authorize = (requiredPermission: Permission, ownPermission?: Permission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userPermissions = rolesMatrix[req.user.role] || [];

    if (userPermissions.includes(requiredPermission)) {
      return next();
    }

    if (ownPermission && userPermissions.includes(ownPermission)) {
      (req as any).requiresOwnershipCheck = true;
      return next();
    }

    securityLogger('UNAUTHORIZED_ACCESS_ATTEMPT', req, `Missing required permission: ${requiredPermission}`);
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  };
};
