import { Request, Response, NextFunction } from 'express';

export const securityLogger = (action: string, req: any, details: string) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId: req.user?.id || 'anonymous',
    role: req.user?.role || 'none',
    ip: req.ip || 'unknown',
    path: req.originalUrl,
    method: req.method,
    details
  };
  console.warn(`[SECURITY AUDIT FAILURE] ${JSON.stringify(logEntry)}`);
};
