/// <reference types="vite/client" />
/// <reference types="@delta-comic/utils" />

declare module '*.css' {}

declare module '*.css?inline' {
  const content: string
  export default content
}