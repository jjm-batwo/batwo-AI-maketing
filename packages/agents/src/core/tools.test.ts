import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  defineTool,
  createToolRegistry,
  globalToolRegistry,
  MetaAdsSearchInterestsInputSchema,
  MetaAdsEstimateAudienceInputSchema,
} from './tools';

describe('defineTool', () => {
  it('should create a tool definition', () => {
    const tool = defineTool({
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: z.object({ query: z.string() }),
      execute: async (input) => ({ result: input.query }),
    });

    expect(tool.name).toBe('test-tool');
    expect(tool.description).toBe('A test tool');
    expect(tool.inputSchema).toBeDefined();
    expect(tool.execute).toBeDefined();
  });

  it('should allow async execution', async () => {
    const tool = defineTool({
      name: 'async-tool',
      description: 'An async tool',
      inputSchema: z.object({ value: z.number() }),
      execute: async (input) => input.value * 2,
    });

    const result = await tool.execute({ value: 5 });
    expect(result).toBe(10);
  });
});

describe('createToolRegistry', () => {
  it('should create an empty registry', () => {
    const registry = createToolRegistry();
    expect(registry.getAll()).toHaveLength(0);
  });

  it('should register and retrieve tools', () => {
    const registry = createToolRegistry();
    const tool = defineTool({
      name: 'my-tool',
      description: 'My tool',
      inputSchema: z.object({ id: z.string() }),
      execute: async (input) => input.id,
    });

    registry.register(tool);

    expect(registry.get('my-tool')).toBeDefined();
    expect(registry.get('my-tool')?.name).toBe('my-tool');
  });

  it('should return undefined for non-existent tool', () => {
    const registry = createToolRegistry();
    expect(registry.get('non-existent')).toBeUndefined();
  });

  it('should get all registered tools', () => {
    const registry = createToolRegistry();

    registry.register(defineTool({
      name: 'tool-1',
      description: 'Tool 1',
      inputSchema: z.object({}),
      execute: async () => 'result1',
    }));

    registry.register(defineTool({
      name: 'tool-2',
      description: 'Tool 2',
      inputSchema: z.object({}),
      execute: async () => 'result2',
    }));

    const all = registry.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((t) => t.name)).toContain('tool-1');
    expect(all.map((t) => t.name)).toContain('tool-2');
  });

  it('should overwrite existing tool with same name', () => {
    const registry = createToolRegistry();

    registry.register(defineTool({
      name: 'same-name',
      description: 'First version',
      inputSchema: z.object({}),
      execute: async () => 'v1',
    }));

    registry.register(defineTool({
      name: 'same-name',
      description: 'Second version',
      inputSchema: z.object({}),
      execute: async () => 'v2',
    }));

    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get('same-name')?.description).toBe('Second version');
  });
});

describe('globalToolRegistry', () => {
  it('should be a ToolRegistry instance', () => {
    expect(globalToolRegistry.register).toBeDefined();
    expect(globalToolRegistry.get).toBeDefined();
    expect(globalToolRegistry.getAll).toBeDefined();
  });
});

describe('MetaAdsSearchInterestsInputSchema', () => {
  it('should validate valid input', () => {
    const input = { query: 'baseball', limit: 10 };
    const result = MetaAdsSearchInterestsInputSchema.parse(input);

    expect(result.query).toBe('baseball');
    expect(result.limit).toBe(10);
  });

  it('should use default limit', () => {
    const input = { query: 'baseball' };
    const result = MetaAdsSearchInterestsInputSchema.parse(input);

    expect(result.limit).toBe(25);
  });

  it('should reject invalid input', () => {
    expect(() => MetaAdsSearchInterestsInputSchema.parse({})).toThrow();
    expect(() => MetaAdsSearchInterestsInputSchema.parse({ query: 123 })).toThrow();
  });
});

describe('MetaAdsEstimateAudienceInputSchema', () => {
  it('should validate valid input', () => {
    const input = {
      accountId: 'act_123456',
      targeting: {
        ageMin: 18,
        ageMax: 65,
        genders: [1, 2],
        geoLocations: {
          countries: ['US', 'KR'],
        },
        interests: [{ id: '123' }],
      },
    };

    const result = MetaAdsEstimateAudienceInputSchema.parse(input);
    expect(result.accountId).toBe('act_123456');
    expect(result.targeting.ageMin).toBe(18);
  });

  it('should validate minimal targeting', () => {
    const input = {
      accountId: 'act_123456',
      targeting: {},
    };

    const result = MetaAdsEstimateAudienceInputSchema.parse(input);
    expect(result.accountId).toBe('act_123456');
  });

  it('should reject missing accountId', () => {
    expect(() =>
      MetaAdsEstimateAudienceInputSchema.parse({ targeting: {} })
    ).toThrow();
  });
});
