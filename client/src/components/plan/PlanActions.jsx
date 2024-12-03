import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Share2,
  Printer,
  RefreshCw,
  FileText,
  Trash2,
} from 'lucide-react';

export function PlanActions({
  onExport,
  onShare,
  onPrint,
  onRegenerateClick,
  onDeleteClick,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onExport('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRegenerateClick}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDeleteClick}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Plan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}