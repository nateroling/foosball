"use strict";

const path = require("path");

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  // Sometimes, optional fields tend to get not picked up by the GraphQL
  // interpreter if not a single content uses it. Therefore, we're putting them
  // through `createNodeField` so that the fields still exist and GraphQL won't
  // trip up. An empty string is still required in replacement to `null`.

  switch (node.internal.type) {
    case "MarkdownRemark": {
      const { permalink, layout } = node.frontmatter;
      const { relativePath } = getNode(node.parent);

      let slug = permalink;

      if (!slug) {
        slug = `/${relativePath.replace(".md", "")}/`;
      }

      // Used to generate URL to view this content.
      createNodeField({
        node,
        name: "slug",
        value: slug || ""
      });

      // Used to determine a page layout.
      createNodeField({
        node,
        name: "layout",
        value: layout || ""
      });
    }
  }
};

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  const result = await graphql(`
    {
      allAirtable {
        edges {
          node {
            data {
              Date
              ID
            }
          }
        }
      }
    }
  `);

  if (result.errors) {
    console.error(result.errors);
    throw new Error(result.errors);
  }

  result.data.allAirtable.edges.forEach(edge => {
    createPage({
      path: `${edge.node.data.ID}`,
      component: path.resolve(`./src/templates/page.tsx`),
      context: {
        slug: edge.node.data.ID
      }
    });
  });
};
