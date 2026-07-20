import { themes as prismThemes } from 'prism-react-renderer';

import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Academia do Programador Docs",
  staticDirectories: ["public", "static"],
  tagline: "",
  favicon: "img/logo.svg",
  trailingSlash: true,
  onBrokenLinks: "throw",

  // Set the production url of your site here
  url: "https://github.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/docs/",
  deploymentBranch: "gh-pages",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "academiadoprogramador-fullstack", // Usually your GitHub org/user name.
  projectName: "docs", // Usually your repo name.

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "throw",
    },
  },

  i18n: {
    defaultLocale: "pt-BR",
    locales: ["pt-BR"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          path: "docs",
          routeBasePath: "/",
          tags: "tags.yml",
          onInlineTags: "throw",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ["@docusaurus/theme-mermaid"],

  themeConfig: {
    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
      navbar: {
        title: "Academia do Programador Docs",
      logo: {
        alt: "Academia do Programador",
        src: "img/logo.svg",
      },
       items: [
         {
           label: "Assuntos",
           to: "/tags",
         },
       ],
    },
    sidebar: {
      hideable: false,
      autoCollapseCategories: false,
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Mais",
          items: [
            {
              label: "Website",
              href: "https://academiadoprogramador.net",
            },
            {
              label: "GitHub",
              href: "https://github.com/academia-do-programador",
            },
          ],
        },
      ],
      copyright: `Direitos Autorais © ${new Date().getFullYear()} - Academia do Programador. Criado com Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["csharp"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
