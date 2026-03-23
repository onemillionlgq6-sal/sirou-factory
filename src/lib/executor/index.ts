/**
 * Executor Layer — Public API
 * Central export for all executor functionality.
 */

export {
  type FactoryAction,
  type RiskLevel,
  type ValidatedAction,
  type ActionBatch,
  classifyRisk,
  validateAndClassify,
  validateBatch,
} from "./action-schema";

export {
  type ExecutionResult,
  type ProjectFileSystem,
  type ProjectFile,
  executeAction,
  executeBatch,
  getProjectFS,
  resetProjectFS,
  loadProjectFS,
} from "./executor-engine";

export {
  type ChangeRecord,
  recordChange,
  undo,
  redo,
  canUndo,
  canRedo,
  getUndoStack,
  getRedoStack,
  buildContextForAI,
  loadHistoryFromJournal,
  clearHistory,
} from "./context-memory";

export {
  type ParseResult,
  parseAIResponse,
  getActionSystemPrompt,
} from "./ai-action-parser";

export { blueprintToActions } from "./blueprint-converter";
