/**
 * @fileoverview LSP Definition Provider for env-doctor
 * 
 * Provides go-to-definition support for environment variables,
 * jumping from usage to the definition in .env files.
 */

import {
  Location,
  LocationLink,
  Range,
  Position,
} from 'vscode-languageserver/node';

import type { EnvVariable, EnvUsage } from '../types/index.js';
import { findEnvVariableAtPosition } from './hover.js';

/**
 * Create a Location for a variable definition in .env file
 */
export function createDefinitionLocation(
  variable: EnvVariable
): Location {
  return {
    uri: `file://${variable.file}`,
    range: {
      start: Position.create(variable.line - 1, 0),
      end: Position.create(variable.line - 1, variable.name.length),
    },
  };
}

/**
 * Create a LocationLink with origin and target ranges
 */
export function createDefinitionLocationLink(
  variable: EnvVariable,
  originRange: Range
): LocationLink {
  return {
    originSelectionRange: originRange,
    targetUri: `file://${variable.file}`,
    targetRange: {
      start: Position.create(variable.line - 1, 0),
      end: Position.create(variable.line - 1, variable.name.length + variable.value.length + 1),
    },
    targetSelectionRange: {
      start: Position.create(variable.line - 1, 0),
      end: Position.create(variable.line - 1, variable.name.length),
    },
  };
}

/**
 * Find definition for variable at position
 */
export function findDefinition(
  lineContent: string,
  character: number,
  definedVariables: EnvVariable[]
): { location: Location; varName: string } | null {
  const found = findEnvVariableAtPosition(lineContent, character);
  if (!found) return null;

  const variable = definedVariables.find(v => v.name === found.name);
  if (!variable) return null;

  return {
    location: createDefinitionLocation(variable),
    varName: found.name,
  };
}

/**
 * Find all references to a variable
 */
export function findReferences(
  varName: string,
  definedVariables: EnvVariable[],
  allUsages: Map<string, EnvUsage[]>,
  includeDefinition: boolean = true
): Location[] {
  const locations: Location[] = [];

  // Add definition location
  if (includeDefinition) {
    const variable = definedVariables.find(v => v.name === varName);
    if (variable) {
      locations.push(createDefinitionLocation(variable));
    }
  }

  // Add all usage locations
  for (const [file, usages] of allUsages) {
    for (const usage of usages) {
      if (usage.name === varName) {
        locations.push({
          uri: `file://${file}`,
          range: {
            start: Position.create(usage.line - 1, usage.column),
            end: Position.create(usage.line - 1, usage.column + varName.length),
          },
        });
      }
    }
  }

  return locations;
}

/**
 * Get references from a specific .env file variable
 * (for when clicking on a variable in .env file)
 */
export function findUsagesOfEnvVariable(
  varName: string,
  allUsages: Map<string, EnvUsage[]>
): Location[] {
  const locations: Location[] = [];

  for (const [file, usages] of allUsages) {
    for (const usage of usages) {
      if (usage.name === varName) {
        locations.push({
          uri: `file://${file}`,
          range: {
            start: Position.create(usage.line - 1, usage.column),
            end: Position.create(usage.line - 1, usage.column + varName.length),
          },
        });
      }
    }
  }

  return locations;
}

/**
 * Parse .env file line to get variable name and range
 */
export function parseEnvFileLine(
  lineContent: string,
  lineNumber: number
): { name: string; range: Range } | null {
  // Match VAR_NAME=value or VAR_NAME= or export VAR_NAME=value
  const match = lineContent.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=/);
  if (!match) return null;

  const varName = match[1];
  const startChar = lineContent.indexOf(varName);

  return {
    name: varName,
    range: {
      start: Position.create(lineNumber, startChar),
      end: Position.create(lineNumber, startChar + varName.length),
    },
  };
}

/**
 * Check if a file is an .env file
 */
export function isEnvFile(uri: string): boolean {
  const envPatterns = [
    /\.env$/,
    /\.env\.[a-z]+$/,
    /\.env\.local$/,
    /\.env\.development$/,
    /\.env\.production$/,
    /\.env\.test$/,
    /\.env\.staging$/,
  ];
  
  return envPatterns.some(pattern => pattern.test(uri));
}

