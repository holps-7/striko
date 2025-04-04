export interface Environment {
  id: string;
  name: string;
  variables: {[key: string]: string};
}