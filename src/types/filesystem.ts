export interface FileSystemNode {
    name: string;
    type: 'file' | 'folder';
    size: number;
    children?: FileSystemNode[];
  }
  
  