"use strict";

require("dotenv").config();

module.exports = {
  siteMetadata: {
    title: "Foosball Stats",
    description: "Foosball Statistics for Cartegraph",
    siteUrl: "https://foos.netlify.com",
    author: {
      name: "Nate Roling",
      url: null
    }
  },
  plugins: [
    {
      resolve: "gatsby-source-airtable",
      options: {
        apiKey: process.env.AIRTABLE_API_KEY,
        tables: [
          {
            baseId: "appqTZSPqdnHWhsHO",
            tableName: "Games",
            tableView: "Grid view",
            tableLinks: [
              "Blue Back",
              "Blue Front",
              "Orange Front",
              "Orange Back"
            ]
          },
          {
            baseId: "appqTZSPqdnHWhsHO",
            tableName: "Players",
            tableView: "Grid view",
            tableLinks: ["Games"]
          }
        ]
      }
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "content",
        path: `${__dirname}/src/content`
      }
    },
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-responsive-iframe",
            options: {
              wrapperStyle: "margin-bottom: 1rem"
            }
          },
          "gatsby-remark-prismjs",
          "gatsby-remark-copy-linked-files",
          "gatsby-remark-smartypants",
          {
            resolve: "gatsby-remark-images",
            options: {
              maxWidth: 1140,
              quality: 90,
              linkImagesToOriginal: false
            }
          }
        ]
      }
    },
    "gatsby-transformer-json",
    {
      resolve: "gatsby-plugin-canonical-urls",
      options: {
        siteUrl: "https://gatsby-starter-typescript-plus.netlify.com"
      }
    },
    "gatsby-plugin-emotion",
    "gatsby-plugin-typescript",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    "gatsby-plugin-react-helmet"
  ]
};
