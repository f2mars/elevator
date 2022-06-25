// node index.js

// const http = require("http");
// const fs = require("fs");

const body = document.querySelector("body");

const kfMixing = 1.4;
let missingPressureInside;
let neckPush;
let consumptionOutside;
let consumptionInside;
let mainElevatorDiameter;
let nozzleElevatorDiameter;
let standartElevetorDiametr;
let elevatoNumber;

let days = [];
let systemPrameters = [];
let systemDeltas = [];

const paramsDescription = [
  "T1 В сети, °C", // 0
  "T2 В сети, °C", // 1
  "P1 В сети, ат", // 2
  "P2 В сети, ат", // 3
  "M1 В сети, т/день", // 4
  "M2 В сети, т/день", // 5
  "V1 В сети, м³", // 6
  "V2 В сети, м³", // 7
  "ΔQ В сети, ГКал", // 8

  "T1 В контуре отопления, °C", // 9
  "T2 В контуре отопления, °C", // 10
  "P1 В контуре отопления, ат", // 11
  "P2 В контуре отопления, ат", // 12
  "M1 В контуре отопления, т/день", // 13
  "M2 В контуре отопления, т/день", // 14
  "V1 В контуре отопления, м³", // 15
  "V2 В контуре отопления, м³", // 16
  "ΔQ В контуре отопления, ГКал", // 8
];

function readFile(input) {
  let file = input.files[0];

  let reader = new FileReader();

  reader.readAsText(file);

  reader.onload = function () {
    const CSVAsText = reader.result;

    let CSVAsObject = CSVAsText.split("\n").map((x) => x.split(";"));

    let daysWithInvalidParams = [];

    let parametersMax = [];
    let parametersMin = [];
    let deltasMax = [];
    let deltasMin = [];

    let parametersAverage = [];

    let deltasAverage = [
      // ΔT Outside // 0
      // ΔP Outside // 1
      // ΔM Outside // 2
      // ΔV Outside // 3
      // ΔT Inside // 4
      // ΔP Inside // 5
      // ΔM Inside // 6
      // ΔV Inside // 7
    ];

    let parametersStandOtklon = [];
    let deltasStandOtklon = [];

    let paramsKvartils = { 25: [], 50: [], 75: [] };
    let deltaKvartils = { 25: [], 50: [], 75: [] };

    let acceptingParamsBorder = {
      lower: [],
      upper: [],
    };

    let acceptingDeltasBorder = {
      lower: [],
      upper: [],
    };

    for (let i = 0; i < 18; i++) {
      systemPrameters.push([]);
      parametersAverage.push(0);
      parametersStandOtklon.push(0);
      acceptingParamsBorder.lower.push(0);
      acceptingParamsBorder.upper.push(0);
    }

    for (let i = 0; i < 8; i++) {
      systemDeltas.push([]);
      deltasAverage.push(0);
      deltasStandOtklon.push(0);
      acceptingDeltasBorder.lower.push(0);
      acceptingDeltasBorder.upper.push(0);
    }

    verifyParameters(CSVAsObject, daysWithInvalidParams);

    collectDates(CSVAsObject, days);

    collectSystemParameters(systemPrameters, CSVAsObject);
    collectSystemDeltas(systemPrameters, systemDeltas);

    while (true) {
      countMinMax(
        systemPrameters,
        systemDeltas,
        parametersMax,
        parametersMin,
        deltasMax,
        deltasMin
      );
      countAverage(
        systemPrameters,
        systemDeltas,
        parametersAverage,
        deltasAverage
      );
      conutStandOtklon(
        systemPrameters,
        systemDeltas,
        parametersAverage,
        deltasAverage,
        parametersStandOtklon,
        deltasStandOtklon
      );
      countKvartils(
        systemPrameters,
        systemDeltas,
        paramsKvartils,
        deltaKvartils
      );
      countAcceptingBorder(
        systemPrameters,
        systemDeltas,
        acceptingParamsBorder,
        acceptingDeltasBorder,
        paramsKvartils,
        deltaKvartils
      );

      identifyEjections(
        daysWithInvalidParams,
        acceptingParamsBorder,
        acceptingDeltasBorder,
        systemPrameters,
        systemDeltas
      );

      if (daysWithInvalidParams.length) {
        deleteDays(days, daysWithInvalidParams);
        newDelete(systemPrameters, systemDeltas, daysWithInvalidParams);
        daysWithInvalidParams = [];
      } else {
        missingPressureInside = deltasAverage[5];
        consumptionOutside = parametersAverage[4] / 24;
        consumptionInside = parametersAverage[13] / 24;
        neckPush =
          (parametersAverage[2] - parametersAverage[11] + deltasAverage[5]) *
          100;
        break;
      }

      parametersMax = [];
      parametersMin = [];
      deltasMax = [];
      deltasMin = [];
      paramsKvartils = { 25: [], 50: [], 75: [] };
      deltaKvartils = { 25: [], 50: [], 75: [] };
    }
  };
}

function verifyParameters(CSVAsObject, daysWithInvalidParams) {
  for (let param = 1; param <= 18; param++) {
    for (let day = 0; day < CSVAsObject.length; day++) {
      if (!CSVAsObject[day][param]) {
        daysWithInvalidParams.push(day);
        continue;
      }
      CSVAsObject[day][param] = CSVAsObject[day][param].trim();
      let spaces = CSVAsObject[day][param].match(/\s/g)?.length;
      if (spaces) {
        for (let i = 0; i < spaces; i++) {
          let spaceIndex = CSVAsObject[day][param].indexOf(" ");
          CSVAsObject[day][param] =
            CSVAsObject[day][param].slice(0, spaceIndex) +
            CSVAsObject[day][param].slice(++spaceIndex);
        }
      }
      let commaIndex = CSVAsObject[day][param].indexOf(",");
      if (commaIndex !== -1) {
        CSVAsObject[day][param] =
          CSVAsObject[day][param].slice(0, commaIndex) +
          "." +
          CSVAsObject[day][param].slice(++commaIndex);
      }
    }
    if (daysWithInvalidParams.length) {
      deleteDays(CSVAsObject, daysWithInvalidParams);
      daysWithInvalidParams = [];
    }
  }
}
function newDelete(systemPrameters, systemDeltas, daysWithInvalidParams) {
  for (let i = daysWithInvalidParams.length - 1; i >= 0; i--) {
    for (let j = 0; j <= systemPrameters.length - 1; j++) {
      systemPrameters[j].splice(daysWithInvalidParams[i], 1);
    }

    for (let j = 0; j <= systemDeltas.length - 1; j++) {
      systemDeltas[j].splice(daysWithInvalidParams[i], 1);
    }
  }
}
function deleteDays(days, daysWithInvalidParams) {
  for (let i = daysWithInvalidParams.length - 1; i >= 0; i--) {
    days.splice(daysWithInvalidParams[i], 1);
  }
}

function collectSystemParameters(systemPrameters, CSVAsObject) {
  for (let param = 1; param <= 18; param++) {
    for (let day = 0; day < CSVAsObject.length; day++) {
      systemPrameters[param - 1].push(CSVAsObject[day][param]);
    }
  }
}

function collectDates(CSVAsObject, days) {
  for (let day = 0; day <= CSVAsObject.length - 1; day++) {
    days.push(String(CSVAsObject[day][0]));
  }
}

function collectSystemDeltas(systemPrameters, systemDeltas) {
  [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [9, 10],
    [11, 12],
    [13, 14],
    [15, 16],
  ].forEach((paramsPare, pareNumber) => {
    for (let day = 0; day < systemPrameters[0].length; day++) {
      systemDeltas[pareNumber].push(
        systemPrameters[paramsPare[0]][day] -
          systemPrameters[paramsPare[1]][day]
      );
    }
  });
}

function countMinMax(
  systemPrameters,
  systemDeltas,
  parametersMax,
  parametersMin,
  deltasMax,
  deltasMin
) {
  for (let parameter = 0; parameter < systemPrameters.length; parameter++) {
    parametersMax.push(Math.max(...systemPrameters[parameter]));
    parametersMin.push(Math.min(...systemPrameters[parameter]));
  }
  for (let parameter = 0; parameter < systemDeltas.length; parameter++) {
    deltasMax.push(Math.max(...systemDeltas[parameter]));
    deltasMin.push(Math.min(...systemDeltas[parameter]));
  }
}

function countAverage(
  systemPrameters,
  systemDeltas,
  parametersAverage,
  deltasAverage
) {
  for (let parameter = 0; parameter < systemPrameters.length; parameter++) {
    parametersAverage[parameter] =
      systemPrameters[parameter].reduce((sum, currentValue) => {
        return (sum += +currentValue);
      }, 0) / systemPrameters[parameter].length;
  }
  for (let parameter = 0; parameter < systemDeltas.length; parameter++) {
    deltasAverage[parameter] =
      systemDeltas[parameter].reduce((sum, currentValue) => {
        return (sum += +currentValue);
      }, 0) / systemDeltas[parameter].length;
  }
}

function conutStandOtklon(
  systemPrameters,
  systemDeltas,
  parametersAverage,
  deltasAverage,
  parametersStandOtklon,
  deltasStandOtklon
) {
  for (let parameter = 0; parameter < systemPrameters.length; parameter++) {
    let result = systemPrameters[parameter].reduce((sum, currentValue) => {
      return (sum += (currentValue - parametersAverage[parameter]) ** 2);
    }, 0);
    parametersStandOtklon[parameter] = Math.sqrt(
      result / (systemPrameters[0].length - 2)
    );
  }
  for (let parameter = 0; parameter < systemDeltas.length; parameter++) {
    let result = systemDeltas[parameter].reduce((sum, currentValue) => {
      return (sum += (currentValue - deltasAverage[parameter]) ** 2);
    }, 0);
    deltasStandOtklon[parameter] = Math.sqrt(
      result / (systemDeltas[0].length - 2)
    );
  }
}

function countKvartils(
  systemPrameters,
  systemDeltas,
  paramsKvartils,
  deltasKvartils
) {
  for (let parameter = 0; parameter < systemPrameters.length; parameter++) {
    let sortedParams = structuredClone(systemPrameters[parameter]).sort(
      (x, y) => x - y
    );
    [25, 50, 75].forEach((percent) => {
      let result =
        +sortedParams[Math.round((sortedParams.length * percent) / 100 - 1)];
      paramsKvartils[`${percent}`].push(result);
    });
  }
  for (let parameter = 0; parameter < systemDeltas.length; parameter++) {
    let sortedDeltas = structuredClone(systemDeltas[parameter]).sort(
      (x, y) => x - y
    );
    [25, 50, 75].forEach((percent) => {
      let result =
        +sortedDeltas[Math.round((sortedDeltas.length * percent) / 100 - 1)];
      deltasKvartils[`${percent}`].push(result);
    });
  }
}

function countAcceptingBorder(
  systemPrameters,
  systemDeltas,
  acceptingParamsBorder,
  acceptingDeltasBorder,
  paramsKvartils,
  deltaKvartils
) {
  for (let parameter = 0; parameter < systemPrameters.length; parameter++) {
    acceptingParamsBorder.lower[parameter] =
      paramsKvartils["25"][parameter] -
      3 * (paramsKvartils["75"][parameter] - paramsKvartils["25"][parameter]);
    acceptingParamsBorder.upper[parameter] =
      paramsKvartils["25"][parameter] +
      3 * (paramsKvartils["75"][parameter] - paramsKvartils["25"][parameter]);
  }
  for (let parameter = 0; parameter < systemDeltas.length; parameter++) {
    acceptingDeltasBorder.lower[parameter] =
      deltaKvartils["25"][parameter] -
      3 * (deltaKvartils["75"][parameter] - deltaKvartils["25"][parameter]);
    acceptingDeltasBorder.upper[parameter] =
      deltaKvartils["25"][parameter] +
      3 * (deltaKvartils["75"][parameter] - deltaKvartils["25"][parameter]);
  }
}

function identifyEjections(
  daysWithInvalidParams,
  acceptingParamsBorder,
  acceptingDeltasBorder,
  systemPrameters,
  systemDeltas
) {
  for (let param = 0; param <= systemDeltas.length - 1; param++) {
    for (let day = systemDeltas[0].length - 1; day >= 0; day--) {
      if (
        systemDeltas[param][day] < acceptingDeltasBorder.lower[param] ||
        systemDeltas[param][day] > acceptingDeltasBorder.upper[param]
      ) {
        if (!daysWithInvalidParams.includes(day)) {
          daysWithInvalidParams.push(day);
        }
      }
    }
  }
  for (let param = 0; param <= systemPrameters.length - 1; param++) {
    for (let day = systemPrameters[0].length - 1; day >= 0; day--) {
      if (
        systemPrameters[param][day] < acceptingParamsBorder.lower[param] ||
        systemPrameters[param][day] > acceptingParamsBorder.upper[param]
      ) {
        if (!daysWithInvalidParams.includes(day)) {
          daysWithInvalidParams.push(day);
        }
      }
    }
  }
}

function calElevatorSize() {
  let resultIsOk = true;
  mainElevatorDiameter =
    8.5 *
    Math.pow(
      (consumptionOutside ** 2 * (1 + kfMixing) ** 2) / missingPressureInside,
      0.25
    );
  nozzleElevatorDiameter =
    9.6 *
    Math.pow(consumptionInside ** 2 / (missingPressureInside * 100), 0.25);
  nozzleElevatorDiameter = nozzleElevatorDiameter.toFixed(1);
  console.log(`mainElevatorDiameter = ${mainElevatorDiameter}`);
  if (mainElevatorDiameter >= 59) {
    standartElevetorDiametr = 59;
    elevatoNumber = 1;
  } else if (mainElevatorDiameter >= 47) {
    standartElevetorDiametr = 47;
    elevatoNumber = 2;
  } else if (mainElevatorDiameter >= 35) {
    standartElevetorDiametr = 35;
    elevatoNumber = 3;
  } else if (mainElevatorDiameter >= 30) {
    standartElevetorDiametr = 30;
    elevatoNumber = 4;
  } else if (mainElevatorDiameter >= 25) {
    standartElevetorDiametr = 25;
    elevatoNumber = 5;
  } else if (mainElevatorDiameter >= 20) {
    standartElevetorDiametr = 20;
    elevatoNumber = 6;
  } else if (mainElevatorDiameter >= 15) {
    standartElevetorDiametr = 15;
    elevatoNumber = 7;
  } else {
    resultIsOk = false;
  }
  if (resultIsOk) {
    alert(
      `Установлен элеватор конструкциии ВТИ-Теплосети МосЭнерго №${elevatoNumber}\nДиаметр камеры смешения = ${standartElevetorDiametr} мм\nДиаметр сопла = ${nozzleElevatorDiameter}±0.5 мм`
    );
  } else {
    alert(
      `Для данной системы элеваторы конструкциии ВТИ-Теплосети МосЭнерго стандартных размеров не подходят`
    );
  }
}

function createGraphics() {
  let selectParamsElement = document.getElementById("paramsForGraph");
  let paramsToShow = Array.from(selectParamsElement.value.split(","));

  let graphWrapper = document.createElement("div");
  graphWrapper.className = "graph-wraper";
  graphWrapper.style = "max-width: 1000px; margin: 0 auto;";
  body.append(graphWrapper);

  let canvasElement = document.createElement("canvas");
  canvasElement.className = "graphics";
  canvasElement.id =
    selectParamsElement.options[selectParamsElement.selectedIndex].label;
  graphWrapper.append(canvasElement);

  let graphScript = document.createElement("script");
  graphScript.innerHTML = `const labels = days;
        const data = {
          labels: labels,
          datasets: [{
            label: paramsDescription[${paramsToShow[0]}],
            backgroundColor: '#D40000',
            borderColor: '#D40000',
            data: systemPrameters[${paramsToShow[0]}],
          }, {
            label: paramsDescription[${paramsToShow[1]}],
            backgroundColor: '#2986cc',
            borderColor: '#2986cc',
            data: systemPrameters[${paramsToShow[1]}]},
          {
            label: paramsDescription[${paramsToShow[2]}],
            backgroundColor: '#ff6384',
            borderColor: '#ff6384',
            data: systemPrameters[${paramsToShow[2]}],
          },
          {
            label: paramsDescription[${paramsToShow[3]}],
            backgroundColor: '#16537e',
            borderColor: '#16537e',
            data: systemPrameters[${paramsToShow[3]}],
          }]
        };
      
        const config = {
          type: 'line',
          data: data,
          options: {}
        };`;

  graphWrapper.append(graphScript);

  const temperature = new Chart(canvasElement, config);

  if (window.innerWidth < 550 && window.innerHeight > window.innerWidth) {
    let adviceToRotate = document.createElement("div");
    adviceToRotate.className = "row hint";
    adviceToRotate.innerHTML = `
        <p>Рекоммендуется перевернуть ваше устройство горизонтально для лучшего отображения графика</p>
    `;
    body.insertBefore(adviceToRotate, graphWrapper);
  }
}
