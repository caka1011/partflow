"use client";

import { useState, useCallback } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getPartCandidates,
  resolvePartItem,
} from "@/lib/actions/assemblies";
import type { BomLineItemRow, PartCandidate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assemblyId: string;
  failedItems: BomLineItemRow[];
  onResolved: (resolvedItemId: string) => void;
}

export function ResolveDialog({
  open,
  onOpenChange,
  assemblyId,
  failedItems,
  onResolved,
}: ResolveDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<PartCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolvedItems, setResolvedItems] = useState<Set<string>>(new Set());

  const remainingCount = failedItems.filter(
    (i) => !resolvedItems.has(i.id)
  ).length;

  const handleSelectItem = useCallback(
    async (itemId: string) => {
      setSelectedItemId(itemId);
      setCandidates([]);
      setCandidateError(null);
      setLoadingCandidates(true);

      const result = await getPartCandidates(assemblyId, itemId);
      setLoadingCandidates(false);
      if (result.success) {
        setCandidates(result.data as PartCandidate[]);
      } else {
        setCandidateError(result.error ?? "Search failed");
      }
    },
    [assemblyId]
  );

  const handleSelect = useCallback(
    async (candidate: PartCandidate) => {
      if (!selectedItemId) return;
      setResolvingId(candidate.PartID);

      const result = await resolvePartItem(
        assemblyId,
        selectedItemId,
        candidate.PartID,
        {
          manufacturer: candidate.Manufacturer,
          description: candidate.Description,
          datasheet: candidate.Datasheet,
        }
      );
      setResolvingId(null);

      if (result.success) {
        const newResolved = new Set([...resolvedItems, selectedItemId]);
        setResolvedItems(newResolved);
        onResolved(selectedItemId);

        // Auto-advance to next unresolved item
        const nextItem = failedItems.find(
          (item) => item.id !== selectedItemId && !newResolved.has(item.id)
        );
        if (nextItem) {
          handleSelectItem(nextItem.id);
        } else {
          setSelectedItemId(null);
          setCandidates([]);
        }
      }
    },
    [assemblyId, selectedItemId, resolvedItems, failedItems, onResolved, handleSelectItem]
  );

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset state when closing
      setSelectedItemId(null);
      setCandidates([]);
      setCandidateError(null);
      setResolvedItems(new Set());
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Resolve Failed Parts
            <Badge
              variant="secondary"
              className="text-xs"
            >
              {remainingCount} remaining
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Select a part from the list, then pick the correct match from Z2Data
            candidates.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 overflow-hidden min-h-[400px] max-h-[60vh]">
          {/* LEFT: Failed items list */}
          <div className="w-64 flex-shrink-0 overflow-y-auto border-r pr-4 space-y-1">
            {failedItems
              .filter((item) => !resolvedItems.has(item.id))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item.id)}
                  className={cn(
                    "w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    selectedItemId === item.id
                      ? "border-blue-300 bg-blue-50"
                      : "hover:bg-muted/50"
                  )}
                >
                  <p className="font-mono font-medium truncate">
                    {item.value}
                  </p>
                  {item.shorttext && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.shorttext}
                    </p>
                  )}
                </button>
              ))}

            {/* Resolved items — greyed out */}
            {failedItems
              .filter((item) => resolvedItems.has(item.id))
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm opacity-40"
                >
                  <CheckCircle2 className="size-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="font-mono truncate">{item.value}</span>
                </div>
              ))}
          </div>

          {/* RIGHT: Candidate results */}
          <div className="flex-1 overflow-y-auto">
            {/* Empty state */}
            {!selectedItemId && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                <Search className="size-8 opacity-30" />
                Select a part from the list to search for candidates
              </div>
            )}

            {/* Loading */}
            {selectedItemId && loadingCandidates && (
              <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching Z2Data...
              </div>
            )}

            {/* Error */}
            {selectedItemId && !loadingCandidates && candidateError && (
              <div className="flex items-center gap-2 text-sm text-red-600 p-4">
                <AlertCircle className="size-4" />
                {candidateError}
              </div>
            )}

            {/* No results */}
            {selectedItemId &&
              !loadingCandidates &&
              !candidateError &&
              candidates.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                  <AlertCircle className="size-8 opacity-30" />
                  No candidates found for this part.
                </div>
              )}

            {/* Candidate table */}
            {selectedItemId &&
              !loadingCandidates &&
              candidates.length > 0 && (
                <div className="space-y-2">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.PartID}
                      className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-sm">
                            {candidate.MPN}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {candidate.Manufacturer}
                          </span>
                          {candidate.Datasheet && (
                            <a
                              href={candidate.Datasheet}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:underline"
                            >
                              PDF
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {candidate.Description}
                        </p>
                        {candidate.ProductType && (
                          <Badge
                            variant="secondary"
                            className="text-xs mt-1"
                          >
                            {candidate.ProductType}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSelect(candidate)}
                        disabled={resolvingId !== null}
                        className="flex-shrink-0 gap-1.5"
                      >
                        {resolvingId === candidate.PartID && (
                          <Loader2 className="size-3.5 animate-spin" />
                        )}
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {resolvedItems.size > 0 ? "Done" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
