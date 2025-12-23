import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn utility function', () => {
  describe('basic functionality', () => {
    it('merges multiple class strings correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500', 'p-4');
      expect(result).toBe('text-red-500 bg-blue-500 p-4');
    });

    it('returns empty string for empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
    });

    it('handles single class string', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });
  });

  describe('conditional classes', () => {
    it('handles objects with boolean values', () => {
      const result = cn({
        'text-red-500': true,
        'bg-blue-500': false,
        'p-4': true,
      });
      expect(result).toBe('text-red-500 p-4');
    });

    it('handles mixed strings and conditional objects', () => {
      const result = cn('base-class', {
        'active': true,
        'disabled': false,
      });
      expect(result).toBe('base-class active');
    });

    it('handles nested conditional objects', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn('btn', {
        'btn-active': isActive,
        'btn-disabled': isDisabled,
        'btn-primary': true,
      });
      expect(result).toBe('btn btn-active btn-primary');
    });
  });

  describe('array handling', () => {
    it('handles arrays of classes', () => {
      const result = cn(['text-red-500', 'bg-blue-500', 'p-4']);
      expect(result).toBe('text-red-500 bg-blue-500 p-4');
    });

    it('handles mixed arrays and strings', () => {
      const result = cn('base-class', ['text-red-500', 'bg-blue-500'], 'p-4');
      expect(result).toBe('base-class text-red-500 bg-blue-500 p-4');
    });

    it('handles nested arrays', () => {
      const result = cn([
        'text-red-500',
        ['bg-blue-500', 'p-4'],
        [['m-2', 'rounded']],
      ]);
      expect(result).toBe('text-red-500 bg-blue-500 p-4 m-2 rounded');
    });
  });

  describe('falsy value handling', () => {
    it('handles undefined values', () => {
      const result = cn('text-red-500', undefined, 'p-4');
      expect(result).toBe('text-red-500 p-4');
    });

    it('handles null values', () => {
      const result = cn('text-red-500', null, 'p-4');
      expect(result).toBe('text-red-500 p-4');
    });

    it('handles false values', () => {
      const result = cn('text-red-500', false, 'p-4');
      expect(result).toBe('text-red-500 p-4');
    });

    it('handles empty string values', () => {
      const result = cn('text-red-500', '', 'p-4');
      expect(result).toBe('text-red-500 p-4');
    });

    it('handles zero (filters it out as falsy)', () => {
      const result = cn('text-red-500', 0, 'p-4');
      // clsx treats 0 as falsy and filters it out
      expect(result).toBe('text-red-500 p-4');
    });

    it('filters out all falsy values including 0', () => {
      const result = cn(undefined, null, false, '', 'valid-class', 0);
      // clsx treats 0 as falsy
      expect(result).toBe('valid-class');
    });
  });

  describe('Tailwind class conflict resolution', () => {
    it('resolves padding conflicts (last wins)', () => {
      const result = cn('p-4', 'p-2');
      expect(result).toBe('p-2');
    });

    it('resolves margin conflicts', () => {
      const result = cn('m-4', 'm-8');
      expect(result).toBe('m-8');
    });

    it('resolves specific directional padding conflicts', () => {
      const result = cn('px-4', 'px-2');
      expect(result).toBe('px-2');
    });

    it('resolves text color conflicts', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('resolves background color conflicts', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('keeps non-conflicting classes together', () => {
      const result = cn('p-4', 'text-red-500', 'p-2', 'bg-blue-500');
      expect(result).toBe('text-red-500 p-2 bg-blue-500');
    });

    it('resolves width conflicts', () => {
      const result = cn('w-full', 'w-1/2');
      expect(result).toBe('w-1/2');
    });

    it('resolves height conflicts', () => {
      const result = cn('h-screen', 'h-full');
      expect(result).toBe('h-full');
    });

    it('resolves flex conflicts', () => {
      const result = cn('flex-row', 'flex-col');
      expect(result).toBe('flex-col');
    });

    it('resolves display conflicts', () => {
      const result = cn('block', 'flex', 'inline');
      expect(result).toBe('inline');
    });
  });

  describe('complex nested combinations', () => {
    it('handles complex mix of strings, objects, and arrays', () => {
      const result = cn(
        'base-class',
        ['array-class-1', 'array-class-2'],
        {
          'conditional-true': true,
          'conditional-false': false,
        },
        'final-class'
      );
      expect(result).toBe(
        'base-class array-class-1 array-class-2 conditional-true final-class'
      );
    });

    it('handles nested arrays with conditionals', () => {
      const result = cn([
        'base',
        ['nested-1', { 'nested-conditional': true }],
        { 'outer-conditional': false },
      ]);
      expect(result).toBe('base nested-1 nested-conditional');
    });

    it('resolves conflicts in complex nested structures', () => {
      const result = cn(
        'p-4',
        ['text-red-500', { 'p-2': true }],
        { 'text-blue-500': true }
      );
      expect(result).toBe('p-2 text-blue-500');
    });

    it('handles real-world component example', () => {
      const isActive = true;
      const isDisabled = false;
      const size = 'large';

      const result = cn(
        'btn',
        'px-4 py-2',
        {
          'btn-active': isActive,
          'btn-disabled': isDisabled,
        },
        size === 'large' && 'px-8 py-4',
        'rounded'
      );

      // Order depends on how clsx processes the inputs
      expect(result).toBe('btn btn-active px-8 py-4 rounded');
    });

    it('handles variant-based styling patterns', () => {
      const variant = 'primary';
      const size = 'md';

      const result = cn(
        'button',
        {
          'bg-blue-500 text-white': variant === 'primary',
          'bg-gray-200 text-gray-800': variant === 'secondary',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        }
      );

      expect(result).toBe('button bg-blue-500 text-white px-4 py-2 text-base');
    });

    it('handles deeply nested conditional logic', () => {
      const result = cn(
        'base',
        [
          'level-1',
          [
            'level-2',
            {
              'level-2-conditional': true,
            },
            [
              'level-3',
              {
                'level-3-conditional-true': true,
                'level-3-conditional-false': false,
              },
            ],
          ],
        ],
        'final'
      );

      expect(result).toBe(
        'base level-1 level-2 level-2-conditional level-3 level-3-conditional-true final'
      );
    });
  });

  describe('edge cases', () => {
    it('handles very long class strings', () => {
      const longClass = Array(50)
        .fill('class')
        .map((c, i) => `${c}-${i}`)
        .join(' ');
      const result = cn(longClass);
      expect(result).toBe(longClass);
    });

    it('handles special characters in class names', () => {
      const result = cn('hover:bg-blue-500', 'focus:ring-2', 'sm:text-lg');
      expect(result).toBe('hover:bg-blue-500 focus:ring-2 sm:text-lg');
    });

    it('handles responsive modifiers', () => {
      const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
      expect(result).toBe('text-sm md:text-base lg:text-lg');
    });

    it('handles dark mode variants', () => {
      const result = cn('bg-white', 'dark:bg-gray-900', 'text-black', 'dark:text-white');
      expect(result).toBe('bg-white dark:bg-gray-900 text-black dark:text-white');
    });

    it('handles arbitrary values', () => {
      const result = cn('w-[200px]', 'h-[100px]', 'bg-[#1da1f2]');
      expect(result).toBe('w-[200px] h-[100px] bg-[#1da1f2]');
    });

    it('resolves conflicts with arbitrary values', () => {
      const result = cn('w-full', 'w-[200px]');
      expect(result).toBe('w-[200px]');
    });
  });
});
