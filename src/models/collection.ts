import { Request } from './request';

export interface Collection {
  id: string;
  name: string;
  requests: Request[];
  folders?: Folder[];
}

export interface Folder {
  id: string;
  name: string;
  requests: Request[];
  folders?: Folder[];
}