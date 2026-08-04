import { FileEdit, History, MoreVertical, UserSearch } from 'lucide-react';

import { Edit2, Link21, Save2, Simcard2, Trash } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import type { VacancyTableActionProps } from '@/views/vacancies/types';

import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cgp/ui-kit/components/ui/dropdown-menu';

export default function VacancyTableAction({
  vacancy,
  onVersionHistory,
  onMatchCandidate,
  onCopyLink,
  onMakeACopy,
  onEdit,
  onEditJd,
  onSaveAsTemplate,
  onDelete,
}: Readonly<VacancyTableActionProps>) {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const location = useLocation();

  const { status, applicantCount, availableActions } = vacancy;
  const hasApplicants = applicantCount > 0;
  const normalizedStatus = status.toLowerCase();

  const isDraft = normalizedStatus === 'draft';
  const isUnpublished = normalizedStatus === 'unpublished';
  const isLive = normalizedStatus === 'live';
  const isExpired = normalizedStatus === 'expired';
  // API enum is ONHOLD (no underscore); on_hold is the form/UI key
  const isOnHold =
    normalizedStatus === 'onhold' || normalizedStatus === 'on_hold';

  const showDuplicate = availableActions
    ? availableActions.includes('MAKE_A_COPY')
    : isUnpublished || isLive || isExpired || isOnHold;
  // Version History is not available for Unpublished vacancies.
  const showVersionHistory = availableActions
    ? availableActions.includes('VERSION_CONTROL')
    : isLive || isExpired || isOnHold;
  const showCopyLink = availableActions
    ? availableActions.includes('COPY_LINK')
    : isUnpublished || isLive || isExpired || isOnHold;
  const showMatchCandidates = availableActions
    ? availableActions.includes('MATCH_CANDIDATE')
    : (isLive || isExpired || isOnHold) && hasApplicants;
  // Delete is available for Draft/Unpublished, and for Live/Expired/On hold
  // only while the vacancy has no applicants yet.
  const showDelete = availableActions
    ? availableActions.includes('DELETE')
    : isDraft ||
      isUnpublished ||
      ((isLive || isExpired || isOnHold) && !hasApplicants);
  const showEditJd = availableActions?.includes('EDIT_JD')
    ? true
    : isUnpublished || isLive || isExpired || isOnHold;
  const showSaveAsTemplate = true;

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      void navigate(`/dashboard/ats/vacancies/${vacancy.id}/edit`, {
        state: { from: location.pathname },
      });
    }
  };

  const handleEditJd = () => {
    if (onEditJd) {
      onEditJd();
    } else {
      void navigate(`/dashboard/ats/vacancies/${vacancy.id}/edit-jd`, {
        state: { from: location.pathname },
      });
    }
  };

  const handleVersionHistory = () => {
    if (onVersionHistory) {
      onVersionHistory();
    } else {
      void navigate(`/dashboard/ats/vacancies/${vacancy.id}/version-history`, {
        state: { from: location.pathname },
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="size-8 p-0"
          onClick={e => e.stopPropagation()}
        >
          <span className="sr-only">
            {t('vacancies.table.actions.openMenu')}
          </span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-47.5 rounded-lg p-3 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.16)]"
        onClick={e => e.stopPropagation()}
      >
        <DropdownMenuItem
          className="gap-2 px-3 py-3 text-sm font-medium text-slate-500"
          onSelect={handleEdit}
        >
          <Edit2 className="size-4 shrink-0" />
          {t('vacancies.table.actions.edit')}
        </DropdownMenuItem>

        {showEditJd && (
          <DropdownMenuItem
            className="gap-2 px-3 py-3 text-sm font-medium text-slate-500"
            onSelect={handleEditJd}
          >
            <FileEdit className="size-4 shrink-0" />
            {t('vacancies.table.actions.editJd')}
          </DropdownMenuItem>
        )}
        {showMatchCandidates && (
          <DropdownMenuItem
            className="gap-2 px-3 py-3 text-sm font-medium text-slate-500"
            onClick={onMatchCandidate}
          >
            <UserSearch className="size-4 shrink-0" />
            {t('vacancies.table.actions.matchCandidate')}
          </DropdownMenuItem>
        )}
        {showCopyLink && (
          <DropdownMenuItem
            className="gap-2 px-3 py-3 text-sm font-medium text-slate-500"
            onClick={onCopyLink}
          >
            <Link21 className="size-4 shrink-0" />
            {t('vacancies.table.actions.copyLink')}
          </DropdownMenuItem>
        )}
        {showVersionHistory && (
          <DropdownMenuItem
            className="gap-2 px-3 py-3 text-sm font-medium text-slate-500"
            onSelect={handleVersionHistory}
          >
            <History className="size-4 shrink-0" />
            {t('vacancies.table.actions.versionHistory')}
          </DropdownMenuItem>
        )}
        {showSaveAsTemplate && (
          <DropdownMenuItem
            className="gap-2 px-3 py-3 text-sm font-medium text-slate-500"
            onClick={onSaveAsTemplate}
          >
            <Save2 className="size-4 shrink-0" />
            {t('vacancies.table.actions.saveAsTemplate')}
          </DropdownMenuItem>
        )}
        {showDuplicate && (
          <DropdownMenuItem
            className="gap-2 px-3 py-3 text-sm font-medium text-slate-500"
            onClick={onMakeACopy}
          >
            <Simcard2 className="size-4 shrink-0" />
            {t('vacancies.table.actions.makeACopy')}
          </DropdownMenuItem>
        )}
        {showDelete && (
          <DropdownMenuItem
            className="gap-2 px-3 py-3 text-sm font-medium text-[#e11d48] focus:text-[#e11d48]"
            onClick={onDelete}
          >
            <Trash className="size-4 shrink-0 text-[#e11d48]" />
            {t('vacancies.table.actions.delete')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
