export interface FolderNode {
  id: string;
  parentId: string | null;
}

function buildChildrenIndex(folders: FolderNode[]) {
  const childrenOf = new Map<string | null, FolderNode[]>();
  for (const f of folders) {
    const key = f.parentId;
    childrenOf.set(key, [...(childrenOf.get(key) ?? []), f]);
  }
  return childrenOf;
}

/** Map of folderId -> that folder's id plus every descendant folder's id. */
export function buildFolderDescendantIds(
  folders: FolderNode[]
): Map<string, Set<string>> {
  const childrenOf = buildChildrenIndex(folders);

  function collect(id: string, acc: Set<string>) {
    acc.add(id);
    for (const child of childrenOf.get(id) ?? []) collect(child.id, acc);
  }

  const result = new Map<string, Set<string>>();
  for (const f of folders) {
    const acc = new Set<string>();
    collect(f.id, acc);
    result.set(f.id, acc);
  }
  return result;
}

/**
 * Map of folderId -> direct note count in that folder plus every descendant
 * folder's note count. `null` (Unfiled) is not a folder node, so it is not
 * aggregated — callers should merge in the direct Unfiled count separately.
 */
export function buildAggregateNoteCounts(
  folders: FolderNode[],
  directCountByFolder: Map<string | null, number>
): Map<string, number> {
  const childrenOf = buildChildrenIndex(folders);
  const memo = new Map<string, number>();

  function sum(id: string): number {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    let total = directCountByFolder.get(id) ?? 0;
    for (const child of childrenOf.get(id) ?? []) total += sum(child.id);
    memo.set(id, total);
    return total;
  }

  const result = new Map<string, number>();
  for (const f of folders) result.set(f.id, sum(f.id));
  return result;
}
