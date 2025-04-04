import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from '../models/request';

export interface ResponseData {
  status: number;
  statusText: string;
  headers: any;
  data: any;
  time: number;
  size: number;
}

export class HttpClient {
  async sendRequest(request: Request): Promise<ResponseData> {
    const startTime = Date.now();
    
    try {
      // Build URL with query parameters
      let url = new URL(request.url);
      if (request.params) {
        Object.keys(request.params).forEach(key => {
          url.searchParams.append(key, request.params![key]);
        });
      }
      
      const config: AxiosRequestConfig = {
        url: url.toString(),
        method: request.method.toLowerCase(),
        headers: request.headers,
        data: request.body,
        validateStatus: () => true // Don't reject on any status code
      };
      
      // Handle auth
      if (request.auth && request.auth.credentials) {
        switch (request.auth.type) {
          case 'basic':
            if (request.auth.credentials.username && request.auth.credentials.password) {
              config.auth = { 
                username: request.auth.credentials.username, 
                password: request.auth.credentials.password 
              };
            }
            break;
          case 'bearer':
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${request.auth.credentials.token}`
            };
            break;
          case 'apikey':
            if (request.auth.credentials.key && request.auth.credentials.value && request.auth.credentials.location) {
              const { key, value, location } = request.auth.credentials;
              if (location === 'header') {
                config.headers = {
                  ...config.headers,
                  [key]: value
                };
              } else if (location === 'query') {
                url.searchParams.append(key, value);
                config.url = url.toString();
              }
            }
            break;
        }
      }

      const response: AxiosResponse = await axios(config);
      const endTime = Date.now();
      
      // Calculate response size (approximate)
      const responseText = typeof response.data === 'object' 
        ? JSON.stringify(response.data) 
        : String(response.data);
      const size = responseText ? new TextEncoder().encode(responseText).length : 0;
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        time: endTime - startTime,
        size: size
      };
    } catch (error) {
      const err = error as Error;
      // Handle network errors
      return {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: { error: err.message },
        time: Date.now() - startTime,
        size: 0
      };
    }
  }
}