export interface Request {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: {[key: string]: string};
  body?: any;
  bodyType?: 'none' | 'json' | 'form' | 'text';
  params?: {[key: string]: string};
  auth?: Auth;
  tests?: string;
  preRun?: string;
}

export interface Auth {
  type: 'none' | 'basic' | 'bearer' | 'apikey';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
    key?: string;
    value?: string;
    location?: 'header' | 'query';
  };
}