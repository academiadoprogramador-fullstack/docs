import { themes as prismThemes } from "prism-react-renderer";

import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Academia do Programador",
  staticDirectories: ["public", "static"],
  tagline: "",
  favicon: "img/logo.svg",
  url: "https://docs.academiadoprogramador.net",
  baseUrl: "/",
  trailingSlash: true,
  onBrokenLinks: "throw",

  markdown: {
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
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "Academia do Programador",
      logo: {
        alt: "Academia do Programador",
        src: "img/logo.svg",
      },
      items: [],
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
