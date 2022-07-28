import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage = sessionStorage;

  getValue<T>(key: string): T | null {
    const value = this.storage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  setValue(key: string, value: any): void {
    this.storage.setItem(key, JSON.stringify(value));
  }

  removeValue(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
}
