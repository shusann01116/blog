declare module "*?url" {
  const url: string;
  export default url;
}

interface ImportMetaEnv {
  readonly VITE_ENABLE_ANALYTICS?: string;
}
