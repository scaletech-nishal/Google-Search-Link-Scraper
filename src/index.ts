import { sequence_id, apikey } from "./config";
import { browser } from "@crawlora/browser";

export default async function ({
  queries,
}: {
  queries: string;
}): Promise<void> {
  const searchQueries = queries
    .trim()
    .split("\n")
    .map((query) => query.trim());

  await browser(
    async ({ page, wait, debug, output }) => {
      for await (const query of searchQueries) {
        try {
          debug(`Initiating search for: "${query}"`);

          await page.goto("https://google.com");
          await wait(2);

          debug(`Typing search query: "${query}"`);
          await page.type('textarea[name="q"]', query);
          await page.keyboard.press("Enter");
          await page.waitForNavigation({ waitUntil: "networkidle2" });

          debug(`Extracting results for query: "${query}"`);
          const extractedResults = await page.evaluate(() => {
            const resultItems = Array.from(document.querySelectorAll("div.g"));
            return resultItems.map((item) => {
              const title = item.querySelector("h3")?.innerText || "No title";
              const link = item.querySelector("a")?.href || "No link";
              const description =
                (item.querySelector("div.IsZvec") as HTMLElement)?.innerText ||
                (item.querySelector("div[data-sncf='1']") as HTMLElement)
                  ?.innerText ||
                (item.querySelector("div[data-snf='nke7rc']") as HTMLElement)
                  ?.innerText ||
                "No description";

              return { title, link, description };
            });
          });

          debug(
            `Fetched ${extractedResults.length} results for query: "${query}"`
          );

          await Promise.all(
            extractedResults.map(async (result) => {
              await output.create({
                sequence_id,
                sequence_output: { query, ...result },
              });
            })
          );
        } catch (error) {
          console.error(`Failed to fetch results for "${query}":`, error);
        }
      }
    },
    {
      apikey: apikey,
      showBrowser: true,
    }
  );
}
