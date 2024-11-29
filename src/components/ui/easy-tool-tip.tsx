import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip";
  
  const EasyTooltip: React.FC<{
    children: React.ReactNode;
    content: React.ReactNode;
  }> = ({ children, content }) => {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent>{content}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  export default EasyTooltip;
  