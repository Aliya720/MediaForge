import { vi } from 'vitest';
import React from 'react';

export function createHookHarness<TProps, TResult>(
  hookFn: (props: TProps) => TResult,
  initialProps: TProps
) {
  const stateMap = new Map<number, unknown>();
  const refMap = new Map<number, { current: unknown }>();
  const effectDepsMap = new Map<number, unknown[] | undefined>();
  const effectCleanupsMap = new Map<number, (() => void) | void>();

  let currentProps = initialProps;
  let result: TResult;
  let isUpdatingState = false;

  function render() {
    let stateIndex = 0;
    let refIndex = 0;
    let effectIndex = 0;

    const spyId = vi.spyOn(React, 'useId').mockReturnValue('media-grid-id');

    const spyState = vi.spyOn(React, 'useState').mockImplementation((initialValue: any) => {
      const idx = stateIndex++;
      if (!stateMap.has(idx)) {
        stateMap.set(idx, typeof initialValue === 'function' ? initialValue() : initialValue);
      }
      const val = stateMap.get(idx);
      const setState = (updater: any) => {
        const currentVal = stateMap.get(idx);
        const newVal = typeof updater === 'function' ? updater(currentVal) : updater;
        if (!Object.is(currentVal, newVal)) {
          stateMap.set(idx, newVal);
          if (!isUpdatingState) {
            isUpdatingState = true;
            try {
              render();
            } finally {
              isUpdatingState = false;
            }
          }
        }
      };
      return [val, setState] as any;
    });

    const spyRef = vi.spyOn(React, 'useRef').mockImplementation((initialValue: any) => {
      const idx = refIndex++;
      if (!refMap.has(idx)) {
        refMap.set(idx, { current: initialValue });
      }
      return refMap.get(idx)! as any;
    });

    const spyCallback = vi.spyOn(React, 'useCallback').mockImplementation((fn: any) => fn);

    const spyEffect = vi.spyOn(React, 'useEffect').mockImplementation((effectFn: any, deps?: unknown[]) => {
      const idx = effectIndex++;
      const hasPrevDeps = effectDepsMap.has(idx);
      const prevDeps = effectDepsMap.get(idx);
      const depsChanged =
        !hasPrevDeps ||
        !deps ||
        !prevDeps ||
        deps.length !== prevDeps.length ||
        deps.some((d, i) => !Object.is(d, prevDeps[i]));

      if (depsChanged) {
        effectDepsMap.set(idx, deps);
        const oldCleanup = effectCleanupsMap.get(idx);
        if (typeof oldCleanup === 'function') {
          oldCleanup();
        }
        const cleanup = effectFn();
        if (typeof cleanup === 'function') {
          effectCleanupsMap.set(idx, cleanup);
        }
      }
    });

    try {
      result = hookFn(currentProps);
    } finally {
      spyId.mockRestore();
      spyState.mockRestore();
      spyRef.mockRestore();
      spyCallback.mockRestore();
      spyEffect.mockRestore();
    }
  }

  render();

  return {
    get current() {
      return result;
    },
    rerender(newProps?: TProps) {
      if (newProps !== undefined) {
        currentProps = newProps;
      }
      render();
    },
    unmount() {
      effectCleanupsMap.forEach((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
      effectCleanupsMap.clear();
    }
  };
}
