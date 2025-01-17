export const forgeRoot = () => {
  const css = `
            :root {
                /* Information and background colors */
                --primary-blue: #2c4c6b;
                --light-blue: #f5f7fa;
                --teal: #3c7b8e;
                --grey: #687789;
                --light-grey: #eef2f6;
                
                /* Call to action colors */
                --cta-default: #9e66ff;
            }
            
            body {
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: var(--light-blue);
                color: var(--primary-blue);
            }
                
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 2rem;
            }`;

  const html = ``;

  return {
    css,
    html,
  };
};
