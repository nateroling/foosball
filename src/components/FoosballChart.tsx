import * as React from "react";
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

export class FoosballChart extends React.Component {
  canvas?: HTMLCanvasElement | null;
  data: any;

  constructor(props: { data: any }) {
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
