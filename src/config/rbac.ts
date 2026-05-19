export type Role = 'admin' | 'editor' | 'author' | 'reader';

export type Permission =
  | 'article:read_public'
  | 'article:read_all'
  | 'article:read_own'
  | 'article:create'
  | 'article:update_all'
  | 'article:update_own'
  | 'article:publish'
  | 'article:delete_all'
  | 'article:delete_own_draft'
  | 'users:manage';

export const rolesMatrix: Record<Role, Permission[]> = {
  admin: [
    'article:read_public', 'article:read_all', 'article:create',
    'article:update_all', 'article:publish', 'article:delete_all', 'users:manage'
  ],
  editor: [
    'article:read_public', 'article:read_all', 'article:create',
    'article:update_all', 'article:publish'
  ],
  author: [
    'article:read_public', 'article:read_own', 'article:create',
    'article:update_own', 'article:delete_own_draft'
  ],
  reader: [
    'article:read_public'
  ]
};
