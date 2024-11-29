export interface FileSystemNode {
    name: string;
    size: number;
    node_type: 'File' | 'Directory';
    children?: FileSystemNode[];
  }
  
  