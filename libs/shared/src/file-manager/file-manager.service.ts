import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileManagerService {
  private readonly dataPath = path.join(__dirname, '..', 'data');

  readFile(fileName: string): any {
    const filePath = path.join(this.dataPath, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${fileName} does not exist`);
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  writeFile(fileName: string, data: any): void {
    const filePath = path.join(this.dataPath, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
