import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Collection } from '../models/collection';
import { Environment } from '../models/environment';

export class StorageProvider {
  private context: vscode.ExtensionContext;
  private storagePath: string;
  private collectionsPath: string;
  private environmentsPath: string;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.storagePath = context.storageUri 
      ? context.storageUri.fsPath 
      : path.join(context.extensionPath, 'data');
    this.collectionsPath = path.join(this.storagePath, 'collections');
    this.environmentsPath = path.join(this.storagePath, 'environments');
    
    console.log('Storage paths:');
    console.log('- storagePath:', this.storagePath);
    console.log('- collectionsPath:', this.collectionsPath);
    console.log('- environmentsPath:', this.environmentsPath);
    
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
    if (!fs.existsSync(this.collectionsPath)) {
      fs.mkdirSync(this.collectionsPath, { recursive: true });
    }
    if (!fs.existsSync(this.environmentsPath)) {
      fs.mkdirSync(this.environmentsPath, { recursive: true });
    }
  }

  // Collection methods
  async saveCollection(collection: Collection): Promise<void> {
    const filePath = path.join(this.collectionsPath, `${collection.id}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(collection, null, 2));
  }

  async getCollection(id: string): Promise<Collection | null> {
    const filePath = path.join(this.collectionsPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async getAllCollections(): Promise<Collection[]> {
    try {
      const files = await fs.promises.readdir(this.collectionsPath);
      console.log('Collection files found:', files.length);
      
      const collections: Collection[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.collectionsPath, file);
          const data = await fs.promises.readFile(filePath, 'utf-8');
          collections.push(JSON.parse(data));
        }
      }
      
      console.log('Collections loaded:', collections.length);
      return collections;
    } catch (error) {
      console.error('Error in getAllCollections:', error);
      return [];
    }
  }

  // Environment methods
  async saveEnvironment(environment: Environment): Promise<void> {
    const filePath = path.join(this.environmentsPath, `${environment.id}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(environment, null, 2));
  }

  async getEnvironment(id: string): Promise<Environment | null> {
    const filePath = path.join(this.environmentsPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async getAllEnvironments(): Promise<Environment[]> {
    const files = await fs.promises.readdir(this.environmentsPath);
    const environments: Environment[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.environmentsPath, file);
        const data = await fs.promises.readFile(filePath, 'utf-8');
        environments.push(JSON.parse(data));
      }
    }
    
    return environments;
  }
}