import "./App.css";
import { toast } from "@/hooks/use-toast";
import FileSystemTree from "@/components/ui/filesystem-tree";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from "./components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { dir } from "console";
import { FileSystemNode } from "./types/filesystem";
import { open } from "@tauri-apps/plugin-dialog";
import { Card, CardContent, CardHeader } from "./components/ui/card";

import { invoke } from "@tauri-apps/api/core";
import { Spinner } from "./components/ui/spinner";
import { ScrollArea } from "./components/ui/scroll-area";
function App() {
  const [directory, setDirectory] = useState<string | undefined>();
  const [node, setNode] = useState<FileSystemNode | undefined>();
  const [scanning, setScanning] = useState(false);

  const handleSelectDirectory = async () => {
    const folder = await open({
      multiple: false,
      directory: true,
    });

    if (folder) {
      setNode(undefined);
      setDirectory(folder);
    }
  };

  const handleScan = async () => {
    if (directory) {
      setScanning(true);
      setNode(undefined);

      const value: FileSystemNode = await invoke("read_recursive", {
        path: directory,
      });

      setScanning(false);
      setNode(value);
    }
  };

  return (
    <main className="m-1 p-2">
      <Menubar className="text border-0 font-semibold">
        <MenubarMenu>
          <MenubarTrigger className="border">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Export To JSON</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <h1 className="text-3xl font-bold text-primary text-left ">
        Rusty Tree
      </h1>

      <div className="mt-6 flex flex-wrap gap-4">
        <Button onClick={handleSelectDirectory} variant="outline">
          Select Directory
        </Button>
        <Button onClick={handleScan} disabled={!directory}>
          Scan
        </Button>
      </div>

      {directory && (
        <Card className="my-2">
          <CardHeader className="">
            <p className="tex-center">{directory}</p>
          </CardHeader>

          <CardContent>
            {node && <FileSystemTree data={node} />}
            {scanning && <Spinner size="md" color="primary" />}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

export default App;
