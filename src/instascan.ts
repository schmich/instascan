import * as Instascan from ".";

declare global {
    interface Window {
        Instascan: typeof Instascan;
    }
}

// @ts-ignore (Typings wants src/index but we have dist/index)
window.Instascan = Instascan;