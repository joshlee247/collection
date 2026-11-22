"use client"

import {
  Tree,
  TreeGroup,
  TreeItem,
  TreeItemIndicator,
  TreeItemLabel,
} from "@ui-sdk/react/tree"
import { ChevronDownIcon, FolderIcon, PackageIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import type { TreeNode } from "@/lib/types"

function branchIds(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) =>
    node.children.length ? [node.id, ...branchIds(node.children)] : []
  )
}

function Nodes({
  nodes,
  onNavigate,
}: {
  nodes: TreeNode[]
  onNavigate?: () => void
}) {
  return nodes.map((node) => (
    <TreeItem key={node.id} value={node.id} label={node.name}>
      <TreeItemLabel
        render={<Link href={`/p/${node.id}`} onClick={onNavigate} />}
      >
        {node.children.length > 0 && (
          <TreeItemIndicator>
            <ChevronDownIcon aria-hidden="true" />
          </TreeItemIndicator>
        )}
        {node.children.length > 0 ? (
          <FolderIcon aria-hidden="true" />
        ) : (
          <PackageIcon aria-hidden="true" />
        )}
        <span className="flex-1">{node.name}</span>
        <span className="ms-auto text-xs tabular-nums text-muted-fg">
          {node.count}
        </span>
      </TreeItemLabel>
      {node.children.length > 0 && (
        <TreeGroup>
          <Nodes nodes={node.children} onNavigate={onNavigate} />
        </TreeGroup>
      )}
    </TreeItem>
  ))
}

export function PortfolioNav({
  tree,
  onNavigate,
}: {
  tree: TreeNode[]
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [defaultExpanded] = useState(() => branchIds(tree))
  const current = pathname.match(/^\/p\/([^/]+)/)?.[1] ?? null

  if (tree.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted-fg">
        No portfolios yet. Create one for each bin or binder.
      </p>
    )
  }

  return (
    <Tree
      aria-label="Portfolios"
      mode="none"
      current={current}
      defaultExpanded={defaultExpanded}
      onAction={(value, { event }) => {
        event?.preventDefault()
        router.push(`/p/${value}`)
        onNavigate?.()
      }}
    >
      <Nodes nodes={tree} onNavigate={onNavigate} />
    </Tree>
  )
}
