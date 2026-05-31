import {
  Copy,
  Edit2,
  History,
  Link2,
  MoreVertical,
  Trash2,
  UserSearch,
} from 'lucide-react';

import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cgp/ui-kit/components/ui/dropdown-menu';

interface VacancyTableActionProps {
  vacancy: {
    id: string;
  };
  onVersionHistory?: () => void;
  onMatchCandidate?: () => void;
  onCopyLink?: () => void;
  onMakeACopy?: () => void;
  onEdit?: () => void;
  onEditJD?: () => void;
  onDelete?: () => void;
}

export default function VacancyTableAction({
  vacancy: _vacancy,
  onVersionHistory,
  onMatchCandidate,
  onCopyLink,
  onMakeACopy,
  onEdit,
  onEditJD,
  onDelete,
}: VacancyTableActionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-47 rounded-lg p-0 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.16)]"
      >
        <DropdownMenuItem
          className="gap-2 px-6 py-3 text-sm font-medium text-slate-500"
          onClick={onVersionHistory}
        >
          <History className="size-4 shrink-0" />
          Version History
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 px-6 py-3 text-sm font-medium text-slate-500"
          onClick={onMatchCandidate}
        >
          <UserSearch className="size-4 shrink-0" />
          Match Candidate
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 px-6 py-3 text-sm font-medium text-slate-500"
          onClick={onCopyLink}
        >
          <Link2 className="size-4 shrink-0" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 px-6 py-3 text-sm font-medium text-slate-500"
          onClick={onMakeACopy}
        >
          <Copy className="size-4 shrink-0" />
          Make a Copy
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 px-6 py-3 text-sm font-medium text-slate-500"
          onClick={onEdit}
        >
          <Edit2 className="size-4 shrink-0" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 px-6 py-3 text-sm font-medium text-slate-500"
          onClick={onEditJD}
        >
          <Edit2 className="size-4 shrink-0" />
          Edit JD
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 px-6 py-3 text-sm font-medium text-[#e11d48] focus:text-[#e11d48]"
          onClick={onDelete}
        >
          <Trash2 className="size-4 shrink-0" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
