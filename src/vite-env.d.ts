/// <reference types="vite/client" />

declare module "virtual:github-stars" {
  const stars: import("./lib/github-stars").RepoStars;
  export default stars;
}
