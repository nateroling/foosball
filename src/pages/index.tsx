import * as React from "react";
import { Link, graphql } from "gatsby";

import Page from "../components/Page";
import Container from "../components/Container";
import IndexLayout from "../layouts";

import * as Chart from "chart.js";
import * as ChartDataLabels from "chartjs-plugin-datalabels";

// Fill chart bg.
Chart.pluginService.register({
  beforeDraw(chart, easing) {
    const helpers = Chart.helpers;
    const ctx = chart.chart.ctx;

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, chart.height, chart.width);
    ctx.restore();
  }
});

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

class FoosballChart extends React.Component {
  canvas?: HTMLCanvasElement | null;
  data: any;

  constructor(props: any) {
    super(props);
    this.data = props.data;
  }

  componentDidMount() {
    if (this.canvas) {
      buildChart(this.canvas, this.data);
    }
  }
  render() {
    return (
      <canvas
        id="chart"
        ref={el => (this.canvas = el)}
        width="400"
        height="400"
      />
    );
  }
}

const IndexPage = (data: any) => {
  const chartData = buildChartData(data.data.players.edges);
  return (
    <IndexLayout>
      <Page>
        <Container>
          <h1>Foosball Stats</h1>
          <FoosballChart data={chartData} />
          <table>
            <tbody>
              {data.data.allAirtable.edges.map((edge: any, idx: any) => (
                <Game key={idx} data={edge.node.data} />
              ))}
            </tbody>
          </table>
        </Container>
      </Page>
    </IndexLayout>
  );
};

export default IndexPage;

const buildChartData = (data: any[]) => {
  const arr: string[][][] = [];
  data.forEach(p => {
    const player = p.node.data;
    const x = player._xGames;
    const y = Math.floor(player.Win__);
    arr[x] = arr[x] || [];
    arr[x][y] = arr[x][y] || [];
    arr[x][y].push(player.Name);
  });
  const values: {}[] = [];
  console.log(arr);
  arr.forEach((xValue, xIndex) => {
    xValue.forEach((yValue, yIndex) => {
      values.push({
        x: xIndex,
        y: yIndex,
        label: yValue.join("\n")
      });
    });
  });
  return values;
};

const buildChart = (element: HTMLCanvasElement, data: any) => {
  return new (Chart as any)(element, {
    options: {
      layout: {
        padding: 50
      }
    },
    plugins: [ChartDataLabels],
    data: {
      datasets: [
        {
          backgroundColor: "orange",
          label: "Win % vs Games Played",
          data,
          datalabels: {
            align: "start",
            anchor: "start"
          }
        }
      ]
    },
    type: "scatter"
  });
};

export const query = graphql`
  {
    players: allAirtable(filter: { table: { eq: "Players" } }) {
      edges {
        node {
          data {
            Name
            _xGames
            Win__
          }
        }
      }
    }
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
