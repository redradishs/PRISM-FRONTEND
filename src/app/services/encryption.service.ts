import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private readonly algorithm = 'AES-GCM';
  private secretKey: CryptoKey | null = null;
  private keyInitialized: Promise<void>;

  constructor() {
    this.keyInitialized = this.initializeKey();
  }

  private async initializeKey(): Promise<void> {
    try {
      const keyHex = environment.encryptionKey;
      if (!keyHex) {
        console.warn('The key is not present, please check it');
        return;
      }

      const keyBuffer = this.hexToBuffer(keyHex);
      this.secretKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: this.algorithm },
        false,
        ['encrypt', 'decrypt'] 
      );
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
    }
  }

  async encrypt(data: any): Promise<string> {
    await this.keyInitialized;

    try {
      if (!this.secretKey) {
        throw new Error('Encryption key not initialized');
      }

      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      const textEncoder = new TextEncoder();
      const dataBuffer = textEncoder.encode(jsonString);

      const iv = window.crypto.getRandomValues(new Uint8Array(16));

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        this.secretKey,
        dataBuffer
      );

      // Extract auth tag (last 16 bytes) and encrypted data
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encryptedData = encryptedArray.slice(0, -16);
      const authTag = encryptedArray.slice(-16);

      // Convert to hex and format as iv:authTag:encryptedData
      const ivHex = this.bufferToHex(iv);
      const authTagHex = this.bufferToHex(authTag);
      const encryptedHex = this.bufferToHex(encryptedData);

      return `${ivHex}:${authTagHex}:${encryptedHex}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    await this.keyInitialized;
    
    try {
      if (!this.secretKey) {
        throw new Error('Encryption key not initialized');
      }

      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = this.hexToBuffer(ivHex);
      const authTag = this.hexToBuffer(authTagHex);
      const encryptedBuffer = this.hexToBuffer(encrypted);

      // Combine encrypted data and auth tag for Web Crypto API
      const combinedBuffer = new Uint8Array(encryptedBuffer.byteLength + authTag.byteLength);
      combinedBuffer.set(new Uint8Array(encryptedBuffer));
      combinedBuffer.set(new Uint8Array(authTag), encryptedBuffer.byteLength);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        this.secretKey,
        combinedBuffer
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  private hexToBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }

  private bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  isEncrypted(data: any): boolean {
    return typeof data === 'string' && data.includes(':') && data.split(':').length === 3;
  }

  //here are the endpoints that needs encryption
  shouldEncryptRequest(url: string, headers?: any): boolean {
    const encryptedEndpoints = [
      '/user/login',
      '/user/signup'
    ];
    
    return encryptedEndpoints.some(endpoint => url.includes(endpoint));
  }
}
