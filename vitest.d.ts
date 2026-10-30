// Test-only Vite resource query; production CSS modules keep Next.js types.
declare module "*.css?inline" {
  const css: string;
  export default css;
}
