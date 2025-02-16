import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileManagerService {
  private readonly dataPath = path.join(process.cwd(), 'data'); // Stores files in the root-level /data folder

  constructor() {
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  readFile(fileName: string): any {
    const filePath = path.join(this.dataPath, fileName);
    if (!fs.existsSync(filePath)) {
      return {}; // Return an empty object if file doesn't exist
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  writeFile(fileName: string, data: any): void {
    this.ensureDirectoryExists(); // Ensure the directory exists before writing
    const filePath = path.join(this.dataPath, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  // Append data to a file without overwriting
  appendToFile(fileName: string, data: string): void {
    const filePath = path.join(this.dataPath, fileName);

    // If the file doesn't exist, create it and write the data
    if (!fs.existsSync(filePath)) {
      this.writeFile(fileName, data); // Write if file doesn't exist
    } else {
      // Read the existing data, if any
      const existingData = fs.readFileSync(filePath, 'utf8');
      const updatedData = existingData ? `${existingData},${data}` : data; // Append data to existing content

      // Write the updated content back to the file
      fs.writeFileSync(filePath, updatedData, 'utf8');
    }
  }

  // Helper method to check if a file exists
  fileExists(fileName: string): boolean {
    const filePath = path.join(this.dataPath, fileName);
    return fs.existsSync(filePath);
  }

  // Helper method to remove a file
  removeFile(fileName: string): void {
    const filePath = path.join(this.dataPath, fileName);
    if (this.fileExists(fileName)) {
      fs.unlinkSync(filePath);
    }
  }

  // Read and write the last run time
  readLastRunTime(): number | null {
    const filePath = path.join(this.dataPath, 'last-run-time.json');
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).lastRunTime;
  }

  writeLastRunTime(timestamp: number): void {
    this.ensureDirectoryExists();
    const filePath = path.join(this.dataPath, 'last-run-time.json');
    const data = { lastRunTime: timestamp };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
