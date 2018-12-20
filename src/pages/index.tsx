import * as React from "react";
import { Link, graphql } from "gatsby";

import Page from "../components/Page";
import Container from "../components/Container";
import IndexLayout from "../layouts";
import { FoosballChart } from "../components/FoosballChart";

const Elo = require("arpad");

interface Player {
  name: string;
  gameCount: number;
  winCount: number;
  winPercent: number;
}

const ghostPlayer = {
  name: "???",
  gameCount: 0,
  winCount: 0,
  winPercent: 0
};

interface Game {
  id: string;
  date: string;
  blueScore: number;
  orangeScore: number;
  blueBack: Player;
  blueFront: Player;
  orangeFront: Player;
  orangeBack: Player;
}

class EloChange {
  change: number;
  constructor(public before: number, public after: number) {
    this.change = after - before;
  }
}

interface GameWithEloChange extends Game {
  blueBackElo: EloChange;
  blueFrontElo: EloChange;
  orangeFrontElo: EloChange;
  orangeBackElo: EloChange;
}

const EloChangeView = (props: { eloChange: EloChange }) => {
  const sign = props.eloChange.change > 0 ? "+" : "-";
  const color = props.eloChange.change > 0 ? "mediumseagreen" : "brown";
  const absval = Math.abs(props.eloChange.change);
  return (
    <span
      style={{
        color,
        minWidth: 30,
        textAlign: "center",
        backgroundColor: "moccasin",
        borderRadius: 5,
        paddingLeft: 2,
        paddingRight: 2,
        float: "right"
      }}
    >
      {sign}
      {absval}
    </span>
  );
};

const Game = (props: { game: GameWithEloChange }) => {
  const g = props.game;
  return (
    <tr>
      <td>{g.date}</td>
      <td>
        {g.blueBack.name} <EloChangeView eloChange={g.blueBackElo} />
      </td>
      <td>
        {g.blueFront.name} <EloChangeView eloChange={g.blueFrontElo} />
      </td>
      <td>{g.blueScore}</td>
      <td>
        {g.orangeFront.name} <EloChangeView eloChange={g.orangeFrontElo} />
      </td>
      <td>
        {g.orangeBack.name} <EloChangeView eloChange={g.orangeBackElo} />
      </td>
      <td>{g.orangeScore}</td>
    </tr>
  );
};

const parsePlayer = (data: any) => {
  if (!data) {
    return ghostPlayer;
  }
  const p = data;
  const gameCount = parseInt(p.gameCount, 10);
  const winCount = parseInt(p.winCount, 10);
  const winPercent = 100 * (winCount / gameCount);
  return {
    gameCount,
    winCount,
    winPercent,
    name: p.name as string
  };
};

const IndexPage = (data: QueryResponse) => {
  const players: Player[] = data.data.players.edges.map(e =>
    parsePlayer(e.node.data)
  );
  const games: Game[] = data.data.games.edges.map(edge => {
    const g = edge.node.data;
    const getPlayer = (player: any) => {
      return player && player[0] && player[0].data
        ? parsePlayer(player[0].data)
        : ghostPlayer;
    };

    return {
      ...g,
      blueScore: parseInt(g.blueScore, 10),
      orangeScore: parseInt(g.orangeScore, 10),
      blueBack: getPlayer(g.blueBack),
      blueFront: getPlayer(g.blueFront),
      orangeFront: getPlayer(g.orangeFront),
      orangeBack: getPlayer(g.orangeBack)
    };
  });
  console.log(games);

  const chartData = buildChartData(players);
  const { playerElos: eloValues, games: eloGames } = buildElo(games);

  return (
    <IndexLayout>
      <Page>
        <Container>
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
              {eloGames.map((game: any, idx: any) => (
                <Game key={idx} game={game} />
              ))}
            </tbody>
          </table>
        </Container>
      </Page>
    </IndexLayout>
  );
};

export default IndexPage;

const buildChartData = (data: Player[]) => {
  const arr: string[][][] = [];
  data.forEach(player => {
    const x = player.gameCount;
    const y = Math.floor(player.winPercent);
    arr[x] = arr[x] || [];
    arr[x][y] = arr[x][y] || [];
    arr[x][y].push(player.name);
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

const buildElo = (
  games: Game[]
): { playerElos: { [_: string]: number }; games: GameWithEloChange[] } => {
  const elo = new Elo({ default: 32 });
  const playerElos: { [_: string]: number } = {};
  const eloGames: GameWithEloChange[] = [];

  for (const g of games) {
    if (!g.blueBack || !g.blueFront || !g.orangeFront || !g.orangeBack) {
      continue;
    }
    const bB = g.blueBack.name;
    const bF = g.blueFront.name;
    const oF = g.orangeFront.name;
    const oB = g.orangeBack.name;

    // Initialize player Elo when necessary.
    playerElos[bB] = playerElos[bB] || 1500;
    playerElos[bF] = playerElos[bF] || 1500;
    playerElos[oF] = playerElos[oF] || 1500;
    playerElos[oB] = playerElos[oB] || 1500;

    // Average team player Elos
    const blueElo = (playerElos[bF] + playerElos[bB]) / 2.0;
    const orangeElo = (playerElos[oF] + playerElos[oB]) / 2.0;

    // ...and use them to get each team's odds.
    const blueOdds = elo.expectedScore(blueElo, orangeElo);
    const orangeOdds = elo.expectedScore(orangeElo, blueElo);

    // Shorthands.
    const bP = g.blueScore;
    const oP = g.orangeScore;

    // Validate scores.
    if (isNaN(bP) || isNaN(oP) || bP === oP || (bP !== 10 && oP !== 10)) {
      continue;
    }

    // 1 for wins, 0 for losses.
    const bWin = bP > oP ? 1 : 0;
    const oWin = 1 - bWin;

    const before: any = {};
    before[bB] = playerElos[bB];
    before[bF] = playerElos[bF];
    before[oF] = playerElos[oF];
    before[oB] = playerElos[oB];

    playerElos[bB] = elo.newRating(blueOdds, bWin, playerElos[bB]);
    playerElos[bF] = elo.newRating(blueOdds, bWin, playerElos[bF]);
    playerElos[oF] = elo.newRating(orangeOdds, oWin, playerElos[oF]);
    playerElos[oB] = elo.newRating(orangeOdds, oWin, playerElos[oB]);

    const change: any = {};
    change[bB] = playerElos[bB] - before[bB];
    change[bF] = playerElos[bF] - before[bF];
    change[oF] = playerElos[oF] - before[oF];
    change[oB] = playerElos[oB] - before[oB];

    console.log(
      `${bB} (${change[bB]}) & ${bF} (${change[bF]}) ${bP} vs ${oP} ${oF} (${
        change[oF]
      }) & ${oB} (${change[oB]})`
    );

    eloGames.push({
      ...g,
      blueBackElo: new EloChange(before[bB], playerElos[bB]),
      blueFrontElo: new EloChange(before[bF], playerElos[bF]),
      orangeFrontElo: new EloChange(before[oF], playerElos[oF]),
      orangeBackElo: new EloChange(before[oB], playerElos[oB])
    });
  }

  return {
    playerElos,
    games: eloGames
  };
};

interface QueryResponse {
  data: {
    players: {
      edges: [
        {
          node: {
            data: {
              name: string;
              gameCount: string;
              winCount: string;
            };
          };
        }
      ];
    };
    games: {
      edges: [
        {
          node: {
            data: {
              id: string;
              date: string;
              blueScore: string;
              orangeScore: string;
              blueBack: { data: { name: string } };
              blueFront: { data: { name: string } };
              orangeFront: { data: { name: string } };
              orangeBack: { data: { name: string } };
            };
          };
        }
      ];
    };
  };
}

export const query = graphql`
  {
    players: allAirtable(filter: { table: { eq: "Players" } }) {
      edges {
        node {
          data {
            name: Name
            gameCount: _xGames
            winCount: _xWins
          }
        }
      }
    }
    games: allAirtable(filter: { table: { eq: "Games" } }) {
      edges {
        node {
          data {
            id: ID
            date: Date
            blueScore: Blue_Score
            orangeScore: Orange_Score
            blueBack: Blue_Back {
              data {
                name: Name
              }
            }
            blueFront: Blue_Front {
              data {
                name: Name
              }
            }
            orangeFront: Orange_Front {
              data {
                name: Name
              }
            }
            orangeBack: Orange_Back {
              data {
                name: Name
              }
            }
          }
        }
      }
    }
  }
`;
