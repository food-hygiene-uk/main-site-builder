import { getClassSuffix } from "../../lib/template/template.ts";

export const forgeHeader = () => {
  const classSuffix = getClassSuffix();

  const css = `
        .component-header-${classSuffix} {
            display: contents;

            header {
                background-color: var(--header-background-color);
                padding: 1rem 2rem;
                border-bottom: 1px solid var(--header-rule-color);

                overflow: hidden;
            }

            .navbar-${classSuffix} {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .logo-${classSuffix} img {
                height: 50px;
            }

            .nav-links-${classSuffix} {
                list-style: none;
                display: flex;
                gap: 1.5rem;

                li {
                    display: inline;

                    a {
                        text-decoration: none;
                        color: var(--header-text-color);
                        font-weight: bold;
                    }
                }
            }
        }`;

  const html = `
        <div class="component-header-${classSuffix}" data-suffix="${classSuffix}">
            <header class="container">
                <nav class="navbar-${classSuffix}">
                    <div class="logo-${classSuffix}">
                        <a href="/">
                            <img src="/images/logo.svg" alt="Site Logo">
                        </a>
                    </div>
                    <ul class="nav-links-${classSuffix}">
                        <li><a href="/about/">About</a></li>
                        <li><a href="/l/">Regions</a></li>
                        <li><a href="/search/">Search</a></li>
                    </ul>
                </nav>
            </header>
        </div>`;

  return {
    css,
    html,
  };
};
