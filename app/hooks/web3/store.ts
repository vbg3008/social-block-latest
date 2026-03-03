import { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from "./types"

// An array to store the detected wallet providers.
let providers: EIP6963ProviderDetail[] = []

export const store = {
  value: () => providers,
  subscribe: (callback: () => void) => {
    function onAnnouncement(event: CustomEvent<EIP6963AnnounceProviderEvent["detail"]>) {
      if (providers.map((p) => p.info.uuid).includes(event.detail.info.uuid)) return
      providers = [...providers, event.detail]
      callback()
    }

    // Listen for eip6963:announceProvider and call onAnnouncement when the event is triggered.
    window.addEventListener("eip6963:announceProvider", onAnnouncement as EventListener)

    // Dispatch the event, which triggers the event listener in the MetaMask wallet.
    window.dispatchEvent(new Event("eip6963:requestProvider"))

    // Return a function that removes the event listener.
    return () =>
      window.removeEventListener("eip6963:announceProvider", onAnnouncement as EventListener)
  },
}
