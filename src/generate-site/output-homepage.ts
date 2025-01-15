import { join } from "@std/path";

export const outputHomepage = async () => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Food Hygiene Ratings UK</title>
    <style>
        :root {
            /* Information and background colors */
            --primary-blue: #2c4c6b;
            --light-blue: #f5f7fa;
            --teal: #3c7b8e;
            --grey: #687789;
            --light-grey: #eef2f6;
            
            /* Call to action colors */
            --cta-orange: #e67e22;
            --cta-hover: #d35400;
        }
        
        body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: var(--light-blue);
            color: var(--primary-blue);
        }

        .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.7;
        }
        
        .hero-image > img {
            max-width: 300px;
            max-height: 300px;
        }

        header {
            background-color: #f8f9fa;
            padding: 1rem 2rem;
            border-bottom: 1px solid #e0e0e0;
        }

        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo img {
            height: 50px;
        }

        .nav-links {
            list-style: none;
            display: flex;
            gap: 1.5rem;
        }

        .nav-links li {
            display: inline;
        }

        .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: bold;
        }

        .main-content {
            display: flex;
            justify-content: center;
            padding: 2rem 1rem;
        }

        .left-side {
            text-align: left;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        .contribute {
            background-color: white;
            padding: 4rem 0;
            margin-top: 2rem;
            text-align: center;
            border-radius: 8px;
        }

        .contribute h2 {
            color: var(--primary-blue);
        }

        .contribute p {
            color: var(--grey);
        }

        .cta-button {
            display: inline-block;
            background-color: var(--cta-orange);
            color: white;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 4px;
            margin: 1rem;
            transition: background-color 0.3s;
            font-weight: 500;
        }

        .cta-button:hover {
            background-color: var(--cta-hover);
            transform: translateY(-1px);
        }

        footer {
            background-color: var(--primary-blue);
            color: var(--light-blue);
            padding: 2rem 0;
            text-align: center;
            margin-top: 2rem;
        }

        footer a {
            color: white;
            text-decoration: none;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            transition: border-color 0.3s;
        }

        footer a:hover {
            border-color: white;
        }
    </style>
</head>
<body>
    <header class="container">
        <nav class="navbar">
            <div class="logo">
                <img src="./images/logo.svg" alt="Site Logo">
            </div>
            <ul class="nav-links">
                <li><a href="./about/">About</a></li>
                <li><a href="./l/">Regions</a></li>
                <li><a href="./search/">Search</a></li>
            </ul>
        </nav>
    </header>

    <main class="container main-content">
        <div class="description">
            <h2>Food Hygiene Ratings UK</h2>
            <p>Feeling hungry? Check to make sure your food is as hygienic as you want it to be.</p>
            <a href="./l/" class="cta-button">Browse By Region</a>
            <a href="./search/" class="cta-button">Search</a>
        </div>
        <div class="hero-image">
            <img src="./images/mascot.svg" alt="Cute chef mascot with chef's hat">
        </div>
    </main>

    <section class="container">
        <section class="contribute">
            <h2>Open Source Project</h2>
            <p>This is an open source project that aims to make food hygiene data more accessible.</p>
            <p>Help us improve by contributing to the project:</p>
            <div>
                <a href="https://github.com/food-hygiene-ratings-uk/food-hygiene-rating-scheme" class="cta-button">View on GitHub</a>
                <a href="https://github.com/food-hygiene-ratings-uk/food-hygiene-rating-scheme/contribute" class="cta-button">Contribute</a>
            </div>
        </section>
    </section>

    <footer>
        <div class="container">
            <p>Food Hygiene Ratings UK - Open Source Project</p>
            <p>Data provided by local authorities across the UK</p>
            <a href="https://github.com/food-hygiene-ratings-uk/food-hygiene-rating-scheme">GitHub Repository</a>
        </div>
    </footer>
</body>
</html>`;

  const filename = `index.html`;
  await Deno.writeTextFile(join("dist", filename), html);
};
