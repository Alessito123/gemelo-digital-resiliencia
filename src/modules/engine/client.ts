import { getApiErrorMessage } from '../ai/contracts';
import { EngineRunInput, EngineRunResult, isEngineRunResult } from './contracts';

type EngineSuccessResponse = { success: true; data: EngineRunResult };

const isSuccessResponse = (value: unknown): value is EngineSuccessResponse =>
  typeof value === 'object'
  && value !== null
  && 'success' in value
  && value.success === true
  && 'data' in value
  && isEngineRunResult(value.data);

export async function runEngine(input: EngineRunInput, signal?: AbortSignal): Promise<EngineRunResult> {
  const response = await fetch('/api/engine/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || !isSuccessResponse(payload)) {
    throw new Error(getApiErrorMessage(payload, 'El motor devolvió una respuesta no válida.'));
  }
  return payload.data;
}
