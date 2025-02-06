export const forgeRoot = () => {
  const css = `
            :root {
              /* Information and background colors */
              --primary-blue: #2c4c6b;
              --light-blue: #f5f7fa;
              --teal: #3c7b8e;
              --grey: #687789;
              --light-grey: #eef2f6;
              --hygiene-green: #84be00;
              
              /* Call to action colors */
              --cta-default: #9e66ff;

              --body-background: var(--light-blue);
              --text-color: #000;
              --header-background-color: #f8f9fa;
              --header-text-color: var(--text-color);
              --header-rule-color: #e0e0e0;
            }

            @media (not (scripting: none)) or (prefers-color-scheme: dark) {
              html:not([data-color-scheme='light']) {
                --body-background: #000;
                --text-color: #757575;
                --header-background-color: #1f2021;
                --header-text-color: #dfdfdf;
                --header-rule-color: #383838;
              }
            } 
            
            body {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: var(--body-background);
              color: var(--text-color);
            }
            
            address {
              font-style: normal;
            }

            a {
              color: #0052a3;
              text-decoration: none;
            }

            a:hover {
              text-decoration: underline;
            }
                
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 2rem;
            }`;

  const html = ``;

  const renderHead = ({title, pageCSS, headerCSS, footerCSS}: {title: string | undefined, pageCSS: string, headerCSS: string, footerCSS: string}) => {

    const fullTitle = [title, "Food Hygiene Ratings UK"].filter(Boolean).join(" - ");

    return `
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fullTitle}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <script>
      "use strict";
      {
        const updateColorScheme = (mql) => {
          const prefers = mql?.matches ? 'dark' : 'light';
          const setting = localStorage.getItem('color-scheme');

          document.documentElement.setAttribute("data-color-scheme", setting ?? prefers);
        }
        const colorSchemeMLQ = globalThis?.matchMedia?.('(prefers-color-scheme:dark)')
        colorSchemeMQL.addEventListener('change', function(e) { updateColorScheme(e);});
        updateColorScheme(colorSchemeMQL);
      }
    </script>
    <style>
        ${css}
        ${pageCSS}
        ${headerCSS}
        ${footerCSS}
    </style>
  </head>
    `
  };

  return {
    css,
    html,
    renderHead,
  };
};
