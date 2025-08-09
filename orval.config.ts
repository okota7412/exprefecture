import { defineConfig } from 'orval'

export default defineConfig({
  exprefecture: {
    input: {
      target: './openapi.yaml', // バックエンドのOpenAPI仕様書のパス
    },
    output: {
      mode: 'split',
      target: './src/api/generated',
      schemas: './src/api/generated/model',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/api/client.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useInfinite: true,
          useInfiniteQueryParam: 'pageParam',
        },
        mutation: {
          useMutation: true,
        },
      },
    },
  },
})
