import * as React from 'react'
import { graphql } from 'gatsby'

import Page from '../components/Page'
import Container from '../components/Container'
import IndexLayout from '../layouts'

interface PageTemplateProps {
  data: {
    site: {
      siteMetadata: {
        title: string
        description: string
        author: {
          name: string
          url: string
        }
      }
    }
    airtable: {
      data: {
        Date: string
        ID: number
      }
    }
  }
}

const PageTemplate: React.SFC<PageTemplateProps> = ({ data }) => (
  <IndexLayout>
    <Page>
      <Container>
        <h1>{data.airtable.data.ID}</h1>
        <div>{data.airtable.data.Date}</div>
      </Container>
    </Page>
  </IndexLayout>
)

export default PageTemplate

export const query = graphql`
  query PageTemplateQuery {
    site {
      siteMetadata {
        title
        description
        author {
          name
          url
        }
      }
    }
    airtable(table: { eq: "Games" }, data: { ID: { eq: 1 } }) {
      data {
        Date
        ID
      }
    }
  }
`
