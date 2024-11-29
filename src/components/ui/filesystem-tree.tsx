import React from 'react';
import { File, Folder, ChevronRight, Copy, Trash, Edit, Download } from 'lucide-react';
import { FileSystemNode } from '@/types/filesystem';
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuLabel,
} from "@/components/ui/context-menu"

interface FileSystemTreeProps {
  data: FileSystemNode;
  level?: number;
  parentSize?: number;
}

const FileSystemTree: React.FC<FileSystemTreeProps> = ({ data, level = 0, parentSize = 0 }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const indent = level * 20;

  const toggleOpen = () => setIsOpen(!isOpen);

  const renderIcon = () => {
    if (data.type === 'folder') {
      return <Folder className="w-4 h-4 mr-2" />;
    }
    return <File className="w-4 h-4 mr-2" />;
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const percentage = parentSize ? (data.size / parentSize) * 100 : 0;

  const handleContextMenuAction = (action: string) => {
    // Implement the actions here
    console.log(`${action} action triggered for ${data.name}`);
  };

  const renderContent = () => (
    <div className="flex items-center py-1 w-full">
      <div className="flex items-center flex-grow">
        {data.type === 'folder' && (
          <ChevronRight 
            className={`w-4 h-4 mr-1 transition-transform ${isOpen ? 'transform rotate-90' : ''}`} 
          />
        )}
        {renderIcon()}
        <span className="mr-2 truncate">{data.name}</span>
        <span className="text-sm text-gray-500 ml-auto mr-4">{formatSize(data.size)}</span>
      </div>
      {parentSize > 0 && (
        <div className="w-24 ml-2">
          <Progress value={percentage} className="h-2" />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginLeft: `${indent}px` }}>
      <ContextMenu>
        <ContextMenuTrigger>
          {data.type === 'folder' ? (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer" onClick={toggleOpen}>
                  {renderContent()}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {data.children && data.children.map((child, index) => (
                  <FileSystemTree key={index} data={child} level={level + 1} parentSize={data.size} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            renderContent()
          )}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuLabel>{data.name}</ContextMenuLabel>
          <ContextMenuItem onSelect={() => handleContextMenuAction('copy')}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy</span>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => handleContextMenuAction('rename')}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => handleContextMenuAction('download')}>
            <Download className="mr-2 h-4 w-4" />
            <span>Download</span>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => handleContextMenuAction('delete')} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default FileSystemTree;

