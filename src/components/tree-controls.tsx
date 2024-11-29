import { Info } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import EasyTooltip from "./ui/easy-tool-tip";

interface Props {
  maxDepth: number;
  minSize: number;

  maxDepthChanged?: (depth: number) => void;
  minSizeChanged?: (minSize: number) => void;
}

function TreeControls({
  maxDepth,
  minSize,
  maxDepthChanged,
  minSizeChanged,
}: Props) {
  return (
    <div className="flex flex-row gap-2">
      <div>
        <EasyTooltip content="Sets the maximum depth traversal">
          <Label className="flex flex-row gap-1 items-center mb-1">
            Max Depth <Info className="w-4 h-4" />
          </Label>
        </EasyTooltip>

        <Input
          value={maxDepth}
          type="number"
          className="w"
          placeholder="Max Depth"
          onChange={val => {
            maxDepthChanged && maxDepthChanged(Number(val.target.value));
          }}
        />
      </div>

      <div>
        <EasyTooltip content="Ignores any file or directory below the provided value in bytes.">
          <Label className="flex flex-row gap-1 items-center mb-1">
            Min Size <Info className="w-4 h-4" />
          </Label>
        </EasyTooltip>

        <Input
          value={minSize}
          type="number"
          className="w"
          placeholder="Min Size (Bytes)"
          onChange={val => {
            minSizeChanged && minSizeChanged(Number(val.target.value));
          }}
        />
      </div>
    </div>
  );
}

export default TreeControls;
