import { useSyncExternalStore } from "react"
import { store } from "./store"
import { EIP6963ProviderDetail } from "./types"

export const useSyncProviders = (): EIP6963ProviderDetail[] =>
  useSyncExternalStore(store.subscribe, store.value, store.value)
