import * as path from 'path';

export const uploadsPath =
  process.env.UPLOADS_PATH ||
  path.join(process.cwd(), 'data', 'uploads');
