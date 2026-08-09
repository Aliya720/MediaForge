import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    alias: {
      'react-native': path.resolve(__dirname, './tests/reactNativeMock.ts'),
    },
  },
});
