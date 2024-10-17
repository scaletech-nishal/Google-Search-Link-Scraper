import GetGoogleLinks from "./index";

async function main() {
  const data = await GetGoogleLinks({
    queries: "Stock market",
  });
}

main();
