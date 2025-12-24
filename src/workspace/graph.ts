/**
 * @fileoverview Dependency graph visualization for workspace analysis
 */

import type { WorkspaceAnalysisResult } from './types.js';

/**
 * Graph node types
 */
export type NodeType = 'variable' | 'package' | 'root';

/**
 * Graph node
 */
export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  metadata?: Record<string, unknown>;
}

/**
 * Graph edge
 */
export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  type: 'uses' | 'defines' | 'inherits';
}

/**
 * Complete graph representation
 */
export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Build a dependency graph from workspace analysis
 */
export function buildDependencyGraph(result: WorkspaceAnalysisResult): DependencyGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  // Add root node
  nodes.push({
    id: 'root',
    type: 'root',
    label: 'Root .env',
    metadata: { variableCount: result.rootVariables.length },
  });
  nodeIds.add('root');

  // Add package nodes
  for (const pkg of result.packages) {
    const nodeId = `pkg_${pkg.package.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    nodes.push({
      id: nodeId,
      type: 'package',
      label: pkg.package.name,
      metadata: {
        framework: pkg.package.framework,
        path: pkg.package.path,
        variableCount: pkg.analysis.definedVariables.length,
      },
    });
    nodeIds.add(nodeId);
  }

  // Add variable nodes for shared variables
  for (const shared of result.sharedVariables) {
    const nodeId = `var_${shared.name}`;
    nodes.push({
      id: nodeId,
      type: 'variable',
      label: shared.name,
      metadata: {
        source: shared.source,
        usedBy: shared.usedBy,
      },
    });
    nodeIds.add(nodeId);

    // Add edge from source to variable
    if (shared.source === 'root') {
      edges.push({
        from: 'root',
        to: nodeId,
        type: 'defines',
      });
    } else {
      const sourceId = `pkg_${shared.source.replace(/[^a-zA-Z0-9]/g, '_')}`;
      if (nodeIds.has(sourceId)) {
        edges.push({
          from: sourceId,
          to: nodeId,
          type: 'defines',
        });
      }
    }

    // Add edges from variable to packages that use it
    for (const pkgName of shared.usedBy) {
      const pkgId = `pkg_${pkgName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      if (nodeIds.has(pkgId)) {
        edges.push({
          from: nodeId,
          to: pkgId,
          type: 'uses',
        });
      }
    }
  }

  // Add inheritance edges
  for (const pkg of result.packages) {
    if (pkg.inheritedVariables.length > 0) {
      const pkgId = `pkg_${pkg.package.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      edges.push({
        from: 'root',
        to: pkgId,
        label: `${pkg.inheritedVariables.length} vars`,
        type: 'inherits',
      });
    }
  }

  return { nodes, edges };
}

/**
 * Generate Mermaid diagram from graph
 */
export function generateMermaidDiagram(graph: DependencyGraph): string {
  const lines: string[] = ['graph TD'];

  // Define subgraphs
  lines.push('    subgraph variables [Environment Variables]');
  for (const node of graph.nodes.filter(n => n.type === 'variable')) {
    lines.push(`        ${node.id}[${node.label}]`);
  }
  lines.push('    end');
  lines.push('');

  lines.push('    subgraph packages [Packages]');
  for (const node of graph.nodes.filter(n => n.type === 'package')) {
    lines.push(`        ${node.id}[${node.label}]`);
  }
  lines.push('    end');
  lines.push('');

  // Add root node
  const rootNode = graph.nodes.find(n => n.type === 'root');
  if (rootNode) {
    lines.push(`    ${rootNode.id}[${rootNode.label}]`);
  }

  // Add edges
  for (const edge of graph.edges) {
    const arrow = edge.type === 'defines' ? '-->' : 
                  edge.type === 'inherits' ? '-..->' : 
                  '-->';
    const label = edge.label ? `|${edge.label}|` : '';
    lines.push(`    ${edge.from} ${arrow}${label} ${edge.to}`);
  }

  return lines.join('\n');
}

/**
 * Generate ASCII art diagram from graph
 */
export function generateAsciiDiagram(result: WorkspaceAnalysisResult): string {
  const lines: string[] = [];

  lines.push('Environment Variable Dependency Graph');
  lines.push('═'.repeat(60));
  lines.push('');

  // Draw root
  lines.push('                    ┌─────────────┐');
  lines.push('                    │  Root .env  │');
  lines.push('                    └──────┬──────┘');
  lines.push('                           │');

  // Calculate package columns
  const packages = result.packages;
  const numPackages = packages.length;

  if (numPackages > 0) {
    // Draw connection lines
    if (numPackages === 1) {
      lines.push('                           │');
      lines.push('                           ▼');
    } else if (numPackages === 2) {
      lines.push('              ┌────────────┴────────────┐');
      lines.push('              │                         │');
      lines.push('              ▼                         ▼');
    } else if (numPackages === 3) {
      lines.push('         ┌────────────┼────────────┐');
      lines.push('         │            │            │');
      lines.push('         ▼            ▼            ▼');
    } else {
      lines.push('    ┌────────┬────────┼────────┬────────┐');
      lines.push('    │        │        │        │        │');
      lines.push('    ▼        ▼        ▼        ▼        ▼');
    }

    // Draw package boxes
    const boxWidth = 14;
    const displayPackages = packages.slice(0, 5); // Show max 5 packages
    const boxes = displayPackages.map(p => {
      const name = p.package.name.length > 12 
        ? p.package.name.slice(0, 11) + '..'
        : p.package.name;
      const padLeft = Math.floor((boxWidth - 2 - name.length) / 2);
      const padRight = boxWidth - 2 - name.length - padLeft;
      return `│${' '.repeat(padLeft)}${name}${' '.repeat(padRight)}│`;
    });

    const topBorder = displayPackages.map(() => '┌' + '─'.repeat(boxWidth - 2) + '┐').join('  ');
    const bottomBorder = displayPackages.map(() => '└' + '─'.repeat(boxWidth - 2) + '┘').join('  ');

    lines.push('   ' + topBorder);
    lines.push('   ' + boxes.join('  '));
    lines.push('   ' + bottomBorder);

    if (packages.length > 5) {
      lines.push(`                    ... and ${packages.length - 5} more packages`);
    }
  }

  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('');

  // Variables flow section
  lines.push('Variables Flow:');
  
  const topShared = result.sharedVariables.slice(0, 10);
  for (const shared of topShared) {
    const usedByStr = shared.usedBy.slice(0, 3).join(', ');
    const more = shared.usedBy.length > 3 ? ` +${shared.usedBy.length - 3}` : '';
    lines.push(`  ${shared.name}: ${shared.source} → ${usedByStr}${more}`);
  }

  if (result.sharedVariables.length > 10) {
    lines.push(`  ... and ${result.sharedVariables.length - 10} more variables`);
  }

  lines.push('');
  lines.push('═'.repeat(60));

  return lines.join('\n');
}

/**
 * Generate JSON representation of graph
 */
export function generateGraphJSON(graph: DependencyGraph): string {
  return JSON.stringify(graph, null, 2);
}

/**
 * Generate DOT format for Graphviz
 */
export function generateDotDiagram(graph: DependencyGraph): string {
  const lines: string[] = [
    'digraph EnvDependencies {',
    '    rankdir=TB;',
    '    node [shape=box, style=rounded];',
    '',
  ];

  // Define node styles
  lines.push('    // Variable nodes');
  lines.push('    node [fillcolor="#e3f2fd", style="rounded,filled"];');
  for (const node of graph.nodes.filter(n => n.type === 'variable')) {
    lines.push(`    ${node.id} [label="${node.label}"];`);
  }

  lines.push('');
  lines.push('    // Package nodes');
  lines.push('    node [fillcolor="#e8f5e9", style="rounded,filled"];');
  for (const node of graph.nodes.filter(n => n.type === 'package')) {
    lines.push(`    ${node.id} [label="${node.label}"];`);
  }

  lines.push('');
  lines.push('    // Root node');
  lines.push('    node [fillcolor="#fff3e0", style="rounded,filled"];');
  const rootNode = graph.nodes.find(n => n.type === 'root');
  if (rootNode) {
    lines.push(`    ${rootNode.id} [label="${rootNode.label}"];`);
  }

  lines.push('');
  lines.push('    // Edges');
  for (const edge of graph.edges) {
    const style = edge.type === 'inherits' ? 'style=dashed' : '';
    const label = edge.label ? `label="${edge.label}"` : '';
    const attrs = [style, label].filter(Boolean).join(', ');
    lines.push(`    ${edge.from} -> ${edge.to}${attrs ? ` [${attrs}]` : ''};`);
  }

  lines.push('}');

  return lines.join('\n');
}

