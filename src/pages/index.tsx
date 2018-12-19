import * as React from "react";
import { Link, graphql } from "gatsby";

import Page from "../components/Page";
import Container from "../components/Container";
import IndexLayout from "../layouts";

import * as Chart from "chart.js";
import * as ChartDataLabels from "chartjs-plugin-datalabels";
const Elo = require("arpad");

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
  const eloValues = buildElo(data.data.games.edges);
  return (
    <IndexLayout>
      <Page>
        <Container>
          <h1>Foosball Stats</h1>
          <FoosballChart data={chartData} />
          <h2>Elo Ratings</h2>
          <table>
            <tbody>
              {Object.keys(eloValues)
                .sort((k1, k2) => eloValues[k2] - eloValues[k1])
                .map((key: string) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{eloValues[key]}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <h2>Games</h2>
          <table>
            <tbody>
              {data.data.games.edges.map((edge: any, idx: any) => (
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

const buildElo = (games: any[]): { [_: string]: number } => {
  const elo = new Elo();
  elo.setMin(100);
  const players: { [_: string]: number } = {};
  for (const game of games) {
    const g = game.node.data;
    const bB = g.Blue_Back[0].data.Name;
    const bF = g.Blue_Front[0].data.Name;
    const oF = g.Orange_Front[0].data.Name;
    const oB = g.Orange_Back[0].data.Name;

    players[bB] = players[bB] || 100;
    players[bF] = players[bF] || 100;
    players[oF] = players[oF] || 100;
    players[oB] = players[oB] || 100;

    const players_b = (players[bF] + players[bB]) / 2.0;
    const players_o = (players[oF] + players[oB]) / 2.0;

    const bPoints = parseInt(g.Blue_Score, 10);
    const oPoints = parseInt(g.Orange_Score, 10);

    if (isNaN(bPoints) || isNaN(oPoints)) {
      continue;
    }

    const tPoints = bPoints + oPoints;

    // Score based on percentage of total goals your team got.
    // 10 goals of 11 total > 10 goals of 19 total
    const bs = bPoints / tPoints;
    const os = oPoints / tPoints;

    const expected = [];

    expected[bB] = elo.expectedScore(players_b, players_o);
    expected[bF] = elo.expectedScore(players_b, players_o);
    expected[oF] = elo.expectedScore(players_o, players_b);
    expected[oB] = elo.expectedScore(players_o, players_b);

    players[bB] = elo.newRating(expected[bB], bs, players[bB]);
    players[bF] = elo.newRating(expected[bF], bs, players[bF]);
    players[oF] = elo.newRating(expected[oF], os, players[oF]);
    players[oB] = elo.newRating(expected[oB], os, players[oB]);
  }
  return players;
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
    games: allAirtable(filter: { table: { eq: "Games" } }) {
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
