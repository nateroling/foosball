import * as React from "react";
import { Link, graphql } from "gatsby";

import Page from "../components/Page";
import Container from "../components/Container";
import IndexLayout from "../layouts";

const Game = (props: { data: any }) => {
  return (
    <tr>
      <td>{props.data.Date}</td>
      <td>{props.data.Blue_Back[0].data.Name}</td>
      <td>{props.data.Blue_Front[0].data.Name}</td>
      <td>{props.data.Blue_Score}</td>
      <td>{props.data.Orange_Front[0].data.Name}</td>
      <td>{props.data.Orange_Back[0].data.Name}</td>
      <td>{props.data.Orange_Score}</td>
    </tr>
  );
};

const IndexPage = (data: any) => {
  console.log(data);
  return (
    <IndexLayout>
      <Page>
        <Container>
          <h1>Foosball Stats</h1>
          <table>
            <tbody>
              {data.data.allAirtable.edges.map((edge: any) => (
                <Game data={edge.node.data} />
              ))}
            </tbody>
          </table>
        </Container>
      </Page>
    </IndexLayout>
  );
};

export default IndexPage;

export const query = graphql`
  {
    allAirtable(filter: { table: { eq: "Games" } }) {
      edges {
        node {
          data {
            Date
            ID
            Blue_Score
            Orange_Score
            Blue_Back {
              data {
                Name
              }
            }
            Blue_Front {
              data {
                Name
              }
            }
            Orange_Front {
              data {
                Name
              }
            }
            Orange_Back {
              data {
                Name
              }
            }
          }
        }
      }
    }
  }
`;
