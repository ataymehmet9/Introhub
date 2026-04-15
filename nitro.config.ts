import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  rollupConfig: {
    external: ['fsevents'],
  },
})

// Made with Bob
