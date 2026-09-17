import { buildContent } from "../../scripts/content/build.ts";

export default async function setup(): Promise<void> {
  await buildContent();
}
