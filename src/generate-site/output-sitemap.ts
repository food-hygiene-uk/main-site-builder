// Function to generate sitemap
export const generateSitemap = async () => {
  const baseUrl = "https://food-hygiene-ratings-uk.github.io";
  const files = Deno.readDir("dist/e");
  let sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for await (const file of files) {
    if (file.isFile && file.name.endsWith(".html")) {
      sitemap += `  <url>\n    <loc>${baseUrl}/e/${file.name}</loc>\n  </url>\n`;
    }
  }

  sitemap += `</urlset>`;
  await Deno.writeTextFile("dist/sitemap.xml", sitemap);
  console.log("Sitemap generated successfully!");
};
