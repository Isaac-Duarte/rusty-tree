import "./App.css";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from "./components/ui/button";
import { useState } from "react";
import { FileSystemNode } from "./types/filesystem";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import { Spinner } from "./components/ui/spinner";
import { formattedDuration } from "./types/util";
import FileSystemTable from "./components/ui/file-system-table";
import { FileOutput, FolderOpen, RefreshCcw } from "lucide-react";
import { ModeToggle } from "./components/mode-toggle";
import { ScrollArea } from "./components/ui/scroll-area";
import TreeControls from "./components/tree-controls";

function App() {
  const [directory, setDirectory] = useState<string | undefined>();
  const [node, setNode] = useState<FileSystemNode | undefined>();
  const [scanning, setScanning] = useState(false);
  const [duration, setDuration] = useState<string | undefined>();

  // Options for tree
  const [treeOptions, setTreeOptions] = useState<{
    maxDepth?: number;
    minSize?: number;
  }>();

  const setMaxDepth = (maxDepth: number) => {
    setTreeOptions({
      ...treeOptions,
      maxDepth,
    });
  };

  const setMinSize = (minSize: number) => {
    setTreeOptions({
      ...treeOptions,
      minSize,
    });
  };

  const handleSelectDirectory = async () => {
    const folder = await open({
      multiple: false,
      directory: true,
    });

    if (folder) {
      setNode(undefined);
      setDirectory(folder);
      setDuration(undefined);
      setScanning(true);

      const value: { node: FileSystemNode; time_took_millis: number } =
        await invoke("read_recursive", {
          path: folder,
          maxDepth: treeOptions?.maxDepth || undefined,
          minSize: treeOptions?.minSize || undefined,
        });

      setNode(value.node);
      setScanning(false);
      setDuration(formattedDuration(value.time_took_millis));
    }
  };

  const handleScan = async () => {
    if (directory) {
      setScanning(true);
      setNode(undefined);
      setDuration(undefined);

      const value: { node: FileSystemNode; time_took_millis: number } =
        await invoke("read_recursive", {
          path: directory,
          maxDepth: treeOptions?.maxDepth || undefined,
          minSize: treeOptions?.minSize || undefined,
        });
        console.log(value);
      setNode(value.node);
      setScanning(false);
      setDuration(formattedDuration(value.time_took_millis));
    }
  };

  return (
    <div className="m-2">
      <div className="flex flex-row justify-between gap-2">
        <Menubar className="w-full border-primary">
          <MenubarMenu>
            <MenubarTrigger className="px-4 py-2">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={handleSelectDirectory}>
                <FolderOpen className="mr-2" /> Select Directory
              </MenubarItem>
              <MenubarItem onClick={handleScan} disabled={!directory}>
                <RefreshCcw className="mr-2" /> Refresh
              </MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>
                  <FileOutput className="mr-2" /> Export
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem
                    onClick={() => {
                      invoke("save_as_json", { prettyPrint: true });
                    }}
                  >
                    JSON (Pretty)
                  </MenubarItem>
                  <MenubarItem
                    onClick={() => {
                      invoke("save_as_json", { prettyPrint: false });
                    }}
                  >
                    JSON
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <ModeToggle />
      </div>

      <header className="text-center my-8">
        <h1 className="text-4xl font-bold text-primary">Rusty Tree</h1>
        <p className="mt-2">
          Visualize and analyze your directory structure efficiently.
        </p>
      </header>

      <ScrollArea className="max-w-[calc(100vw-1rem)] mx-auto w-full">
        {directory ? (
          <>
            <div className="mb-2 flex flex-row gap-2 items-end">
              <Button
                onClick={handleSelectDirectory}
                disabled={!directory}
                variant="default"
                className="text-xl"
              >
                <FolderOpen className="w-10 h-10" />
                Select Directory
              </Button>

              <Button
                onClick={handleScan}
                disabled={!directory}
                variant="outline"
                className="text-xl"
              >
                <RefreshCcw className="text-2xl" />
                Refresh
              </Button>

              <TreeControls
                maxDepth={treeOptions?.maxDepth || 0}
                minSize={treeOptions?.minSize || 0}
                maxDepthChanged={setMaxDepth}
                minSizeChanged={setMinSize}
              />
            </div>
            <Card className="relative">
              {scanning && (
                <div className="absolute inset-0 bg-opacity-75 flex items-center justify-center">
                  <Spinner size="lg" color="primary" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-semibold flex flex-row gap-2">
                  Directory Information
                </CardTitle>
                <CardDescription className="mt-2">
                  {node && (
                    <p>
                      <strong>Scan Duration:</strong> {duration || "0ms"}
                    </p>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {node && <FileSystemTable data={node} />}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center mt-8 gap-2 ">
            <p className="text-xl mb-6">
              No directory selected. Please select a directory to begin.
            </p>
            <Button
              onClick={handleSelectDirectory}
              variant="outline"
              className="flex items-center px-6 py-3 text-lg"
            >
              <FolderOpen className="mr-2" /> Select Directory
            </Button>

            <TreeControls
              maxDepth={treeOptions?.maxDepth || 0}
              minSize={treeOptions?.minSize || 0}
              maxDepthChanged={setMaxDepth}
              minSizeChanged={setMinSize}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default App;
