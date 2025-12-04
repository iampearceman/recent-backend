import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Module under test
import * as servicesFactory from '../../services/create-services'
import { runPeriodicSync } from '../cron-sync'

describe('runPeriodicSync', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('enqueues sync jobs for all eligible tools', async () => {
    const tools = [{ id: 't1' }, { id: 't2' }]

    const enqueue = vi.fn().mockResolvedValue(undefined)

    // Spy on createServices and return a mocked services object
    const spy = vi.spyOn(servicesFactory, 'createServices').mockImplementation((): any => ({
      tools: { getToolsEligibleForSync: vi.fn().mockResolvedValue(tools) },
      queue: { enqueue },
    }))

    await runPeriodicSync({} as any)

    expect(spy).toHaveBeenCalled()
    expect(enqueue).toHaveBeenCalledTimes(2)
    expect((enqueue.mock.calls[0][0]).toolId).toBe('t1')
    expect((enqueue.mock.calls[1][0]).toolId).toBe('t2')
  })

  it('does nothing if no tools are eligible', async () => {
    const enqueue = vi.fn()

    vi.spyOn(servicesFactory, 'createServices').mockImplementation((): any => ({
      tools: { getToolsEligibleForSync: vi.fn().mockResolvedValue([]) },
      queue: { enqueue },
    }))

    await runPeriodicSync({} as any)

    expect(enqueue).not.toHaveBeenCalled()
  })

  it('calls sync.runToolSync when no queue producer is available', async () => {
    const tools = [{ id: 't-abc' }]
    const runToolSync = vi.fn().mockResolvedValue(undefined)

    vi.spyOn(servicesFactory, 'createServices').mockImplementation((): any => ({
      tools: { getToolsEligibleForSync: vi.fn().mockResolvedValue(tools) },
      sync: { runToolSync },
    }))

    await runPeriodicSync({} as any)

    expect(runToolSync).toHaveBeenCalledTimes(1)
    expect(runToolSync).toHaveBeenCalledWith('t-abc')
  })
})
