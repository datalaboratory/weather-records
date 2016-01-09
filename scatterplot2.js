var months = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var monthNames = ['янв', 'фев', 'марта', 'апр', 'мая', 'июня', 'июля', 'авг', 'сен', 'окт', 'ноя', 'дек'];
var monthNamesFull = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
var dotCoords = [
  ['MSK', 8, 18],
  ['SPB', 9, 13],
  ['NSK', 34, 35],
  ['EKB', 22, 27],
  ['NN', 13, 23],
  ['KAZ', 15, 25],
  ['CHE', 20, 31],
  ['OMK', 28, 33],
  ['SAM', 13, 28],
  ['UFA', 18, 28],
  ['ROS', 4, 28],
  ['KSK', 39, 35],
  ['PRM', 20, 26],
  ['VLG', 8, 29],
  ['VRN', 8, 25],
  ['SOC', 1, 31]
];

var year = (new Date()).getFullYear();

var clr1 = d3.scale.linear()
  .interpolate(d3.interpolateHcl)
  .domain([-45, -2, 10, 45])
  .range(['#2588e3', '#79dee7', '#f9e687', '#ff5959']);

var clr2 = d3.scale.linear()
  .interpolate(d3.interpolateHcl)
  .domain([-45, -2, 10, 45])
  .range(['#1f619e', '#35acc6', '#d6b40a', '#c60202']);

function getRetinaRatio(ctx) {
  var devicePixelRatio = window.devicePixelRatio || 1;
  var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio || 1;

  return devicePixelRatio / backingStoreRatio;
}

var yDomain = [60, -60];

var mouseOvercity = ['', ''];

var daysCaption = ['дней', 'день', 'дня', 'дня', 'дня', 'дней', 'дней', 'дней', 'дней', 'дней'];

var offset = 0;

var minMaxCur = [];
var curMinMax = {
  city: '',
  min: [0, 0, 0, '', 0, 0, '', ''],
  max: [0, 0, 0, '', 0, 0, '', ''],
  cur: [0, 0, 0, '', 0, 0, '', '']
};

function getMouseMinMax(date, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i][1] == date) {
      return array[i];
    }
  }
  return -1;
}
function getDateX(x) {
  var monthCounter = 1;
  for (var i = 0; i < months.length; i++) {
    if (x > months[i]) {
      x -= months[i];
      if (i == 1) {
        x++;
      }
      monthCounter++;
    } else {
      break;
    }
  }
  if (monthCounter < 10) {
    monthCounter = '0' + monthCounter;
  }
  if (x < 10) {
    x = '0' + x
  }
  return x + '.' + monthCounter;
}

//Переводим дату в координату по оси X
function getX(date) {
  var curMonth = Number(date.substr(3, 2)) - 1;
  var day = Number(date.substr(0, 2));

  for (var i = 0; i < curMonth; i++) {
    day += months[i];
  }

  return day;
}

//Рассчитываем какие точки с какой прозрачностью рисовать
//Те, у которых tempcount больше — менее прозрачные
//Минимальная прозрачность 20%
function establishOpacity(data) {
  return d3.scale.linear()
    .range([0.2, 1])
    .domain(d3.extent(data, function (d) {
      return d.tempcount;
    }));
}

//Вычисляет количество солнечных и количество пасмурных дней
//Солнечный день — когда меньше 20% облаков
//Пасмурный день — когда больше 80% облаков
function getCloudageAndRain(temps) {
  var cloudy = 0, sunny = 0, rain = 0;
  temps.forEach(function (d) {
    rain += Number(d.rain);
    var clouds = Number(d.clouds);
    if (clouds > 80) {
      cloudy++;
    }
    if (clouds < 20) {
      if (clouds != -1) {
        sunny++;
      }
    }
  });

  cloudy = Math.round((cloudy / temps.length) * 365);
  sunny = Math.round((sunny / temps.length) * 365);
  rain = Math.round((rain / 119) * 12);

  return {cloudy: cloudy, sunny: sunny, rain: rain};
}

//Рисует весь график, заполняет фактоиды
function drawGraph(data) {
  //считаем с какой прозрачностью надо рисовать точки
  var o = establishOpacity(data);

  //группируем данные по городам
  var nested = d3.nest()
    .key(function (d) {
      return d.city;
    });
  nested = nested.entries(data);

  //рисуем график для каждого города
  nested.forEach(function (d) {
    var city = d.key; //текущий город
    //if (city != 'OMK') return;
    var temps = d.values; //все данные о температурах в текущем городе

    //считаем количество пасмурных, солнечных дней и осадков
    //и заполняем фактоиды
    var factoids = getCloudageAndRain(temps);
    $('#' + city + ' .sun').html(factoids.sunny);
    $('#' + city + ' .clouds').html(factoids.cloudy);
    $('#' + city + ' .rain').html(factoids.rain);
    $('#' + city + ' .daysCaption1').html(function () {
      return daysCaption[factoids.cloudy % 10];
    });
    $('#' + city + ' .daysCaption2').html(function () {
      return daysCaption[factoids.sunny % 10];
    });

    //задаем размеры графика и радиус кружка
    //для Москвы всё больше
    var w = 220;
    var h = 100;
    var r = 0.6;
    if (city == 'MSK') {
      w = 1000;
      h = 200;
      r = 1.1;
    }
    var x = d3.scale
      .linear()
      .range([0, w])
      .domain([0, 366]);

    var y = d3.scale
      .linear()
      .range([0, h])
      .domain(yDomain);

    var cityGraph = d3.select('#' + city + ' .graph');

    var canvas = cityGraph.append('canvas');
    var ctx = canvas.node().getContext('2d');
    var ratio = getRetinaRatio(ctx);
    var scaledWidth = w * ratio;
    var scaledHeight = h * ratio;

    canvas
      .attr('width', scaledWidth)
      .attr('height', scaledHeight)
      .style('width', w)
      .style('height', h);

    ctx.scale(ratio, ratio);

    temps.forEach(function forEachTemp(temp) {
      var d = temp;
      var color = d3.rgb(clr1(d.temp));

      ctx.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + o(Number(d.tempcount)) + ')';
      ctx.beginPath();
      ctx.arc(x(getX(d.curtime.substr(0, 5))), y(d.temp), r, 0, 2 * Math.PI);
      ctx.fill();
    });

    //Прицепляем к диву с классом .graph svg-контейнер
    var citySvg = cityGraph
      .append('svg')
      .attr('width', w + 40)
      .attr('height', h);

    citySvg
      .append('rect')
      .attr('x', 0)
      .attr('y', y(0))
      .attr('width', w)
      .attr('height', 1)
      .attr('fill', clr2(0))
      .attr('opacity', 0.3);

    if (city == 'MSK') {
      citySvg
        .append('text')
        .attr('class', 'zero')
        .attr('x', x(368))
        .attr('y', y(0))
        .text('0°С')
        .attr('dy', '.35em')
        .attr('fill', clr2(0));
    }
  });

  $('canvas')
    .mouseout(function () {
      var curCity = $(this).parents('.cityInfo').attr('id');

      restorePoints(curCity);
    })
    .mousemove(function (e) {
      var curCity = $(this).parents('.cityInfo').attr('id');

      mouseOvercity[0] = mouseOvercity[1];
      mouseOvercity[1] = curCity;

      //группируем данные по городам
      var nested = d3.nest()
        .key(function (d) {
          return d[0];
        });
      nested = nested.entries(minMaxCur);

      //берем данные нужного города
      //исполняем цикл, если мы только что навели на город
      if (mouseOvercity[0] != mouseOvercity[1]) {
        for (var i = 0; i < nested.length; i++) {
          if (nested[i].key == curCity) {
            cityData = nested[i].values;
          }
        }
      }
      //определяем координаты X у графика
      var leftX = $(this).offset().left;
      var width = $(this).css('width');
      var px = width.indexOf('px');
      width = Number(width.substr(0, px));
      var rightX = leftX + width;

      var x = e.pageX;
      if (x > rightX) {
        x = rightX
      }
      var day = Math.round(((x - leftX) / (rightX - leftX)) * 365);
      if (day == 0) {
        day = 1
      }

      var date = getDateX(day);
      var minmax = getMouseMinMax(date, cityData);

      savePoints(curCity);
      placeMousePoints(leftX, x, minmax);
      console.log('curdate', date, minmax, curMinMax);
    });

}

function drawCurrentYear(data) {
  var w;
  var h;
  var r;

  var nested = d3.nest()
    .key(function (d) {
      return d.city;
    });

  nested = nested.entries(data);

  for (var city = 0; city < nested.length; city++) {
    var curCity = nested[city].key;
    var tempData = nested[city].values;

    if (curCity == 'MSK') {
      w = 1000;
      h = 200;
      r = 1.25;
    } else {
      w = 220;
      h = 100;
      r = 0.75;
    }

    var x = d3.scale
      .linear()
      .range([0, w])
      .domain([0, 366]);

    var y = d3.scale
      .linear()
      .range([0, h])
      .domain(yDomain);

    var line = d3.svg.line()
      .interpolate('basis')
      .x(function (d) {
        return x(getX(d.curtime.substr(0, 5)))
      })
      .y(function (d) {
        return y(d.temp)
      });

    var citySvg = d3.select('#' + curCity + ' .graph svg');

    citySvg.append('g')
      .attr('class', 'currentTemps');

    citySvg.append('path')
      .datum(tempData)
      .attr('class', 'line')
      .attr('d', line);
  }
}

function getMinMax(data) {
  var nested = d3.nest()
    .key(function (d) {
      return d.city;
    })
    .key(function (d) {
      return d.curtime.substr(0, 5);
    });
  nested = nested.entries(data);

  for (var city = 0; city < nested.length; city++) {
    var curCity = nested[city].key;
    var daysData = nested[city].values;

    for (var day = 0; day < daysData.length; day++) {
      var values = daysData[day].values[0];
      var curTime = values.curtime.substr(0, 5);
      var min = Number(values.min);
      var max = Number(values.max);
      var minYear = Number(values.yearmin);
      var maxyear = Number(values.yearmax);

      minMaxCur.push([
        curCity, curTime, min, max, 0, minYear, maxyear
      ])
    }
  }
}

function getCur(data, minMaxCur) {
  data.forEach(function (d) {
    for (var i = 0; i < minMaxCur.length; i++) {
      if (d.city == minMaxCur[i][0] && d.curtime.substr(0, 5) == minMaxCur[i][1]) {
        minMaxCur[i][4] = Number(d.temp);
      }
    }
  });

  return minMaxCur;
}

function placeMousePoints(left, x, data) {
  var minY;
  var maxY;
  var minYt;
  var maxYt;

  var city = data[0];

  var array;
  if (city == 'MSK') {
    array = monthNamesFull;
  } else {
    array = monthNames;
  }
  var curT = Number(data[1].substr(0, 2)) + ' ' + array[Number(data[1].substr(3, 2)) - 1];

  var minT = Number(data[2]);
  var maxT = Number(data[3]);

  //прилепляем — или + к рекордам
  if (minT > 0) {
    minT = '+' + minT;
  } else {
    minT += '';
    if (minT !== '0') {
      minT = minT.substr(1, minT.length - 1);
      minT = '−' + minT;
    }
  }
  if (maxT > 0) {
    maxT = '+' + maxT;
  } else {
    maxT += '';
    if (minT !== '0') {
      maxT = '−' + maxT.substr(1, maxT.length - 1);
    }
  }
  if (city == 'MSK') {
    minT += '°C в ' + data[5];
    maxT += '°C в ' + data[6];
  } else {
    minT += ' в ' + data[5];
    maxT += ' в ' + data[6];
  }

  var h = 100;
  if (city == 'MSK') {
    h = 200;
  }
  var y = d3.scale
    .linear()
    .range([0, h])
    .domain(yDomain);

  minYt = y(data[2]);
  minY = y(data[2]);
  maxYt = y(data[3]);
  maxY = y(data[3]);

  d3.select('#' + city + ' .minDot')
    .attr('cx', x - left)
    .attr('cy', minY)
    .attr('fill', function () {
      return clr2(data[2])
    });

  d3.select('#' + city + ' .maxDot')
    .attr('cx', x - left)
    .attr('cy', maxY)
    .attr('fill', function () {
      return clr2(data[3])
    });


  d3.select('#' + city + ' .minT text')
    .attr('x', function () {
      if (city == 'MSK' && x - left > 907) {
        return x - left - 4;
      } else if (city != 'MSK' && x - left > 163) {
        return x - left - 4;
      } else {
        return x - left + 4;
      }
    })
    .attr('y', minYt)
    .attr('fill', function () {
      return clr2(data[2])
    })
    .style('text-anchor', function () {
      if (city == 'MSK' && x - left > 907) {
        return 'end';
      } else if (city != 'MSK' && x - left > 163) {
        return 'end';
      } else {
        return 'start';
      }
    })
    .text(minT);

  d3.select('#' + city + ' .maxT text')
    .attr('x', function () {
      if (city == 'MSK' && x - left > 907) {
        return x - left - 4;
      } else if (city != 'MSK' && x - left > 163) {
        return x - left - 4;
      } else {
        return x - left + 4;
      }
    })
    .attr('y', maxYt)
    .attr('fill', function () {
      return clr2(data[3])
    })
    .style('text-anchor', function () {
      if (city == 'MSK' && x - left > 907) {
        return 'end';
      } else if (city != 'MSK' && x - left > 163) {
        return 'end';
      } else {
        return 'start';
      }
    })
    .text(maxT);

  var yMargin;
  if (city == 'MSK') {
    yMargin = 18;
  } else {
    yMargin = 11;
  }
  console.log(city, yMargin);
  d3.select('#' + city + ' .curT text')
    .attr('x', function () {
      if (city == 'MSK' && x - left > 907) {
        return x - left - 4;
      } else if (city != 'MSK' && x - left > 163) {
        return x - left - 4;
      } else {
        if (city == 'MSK') {
          return x - left + 13;
        } else {
          return x - left + 11;
        }
      }
    })
    .attr('y', maxYt - yMargin)
    .attr('fill', '#000')
    .style('text-anchor', function () {
      if (city == 'MSK' && x - left > 907) {
        return 'end';
      } else if (city != 'MSK' && x - left > 163) {
        return 'end';
      } else {
        return 'start';
      }
    })
    .text(curT)
    .attr('id', 'mouseovertext');
}

function restorePoints(city) {
  d3.select('#' + city + ' .minDot')
    .attr('cx', curMinMax.min[0])
    .attr('cy', curMinMax.min[1])
    .attr('fill', curMinMax.min[3]);

  d3.select('#' + city + ' .maxDot')
    .attr('cx', curMinMax.max[0])
    .attr('cy', curMinMax.max[1])
    .attr('fill', curMinMax.max[3]);

  d3.select('#' + city + ' .minT text')
    .attr('x', curMinMax.min[4])
    .attr('y', curMinMax.min[5])
    .attr('fill', curMinMax.min[6])
    .style('text-anchor', 'start')
    .text(curMinMax.min[7]);


  d3.select('#' + city + ' .maxT text')
    .attr('x', curMinMax.max[4])
    .attr('y', curMinMax.max[5])
    .attr('fill', curMinMax.max[6])
    .style('text-anchor', 'start')
    .text(curMinMax.max[7]);

  d3.select('#' + city + ' .curT text')
    .attr('x', curMinMax.cur[4])
    .attr('y', curMinMax.cur[5])
    .attr('fill', curMinMax.cur[6])
    .attr('id', 'notmouseovertext')
    .style('text-anchor', 'start')
    .text(curMinMax.cur[7])
}

function savePoints(city) {
  if (curMinMax.city == city) return;
  curMinMax.city = city;

  var dot = d3.select('#' + city + ' .minDot');

  curMinMax.min[0] = dot.attr('cx');
  curMinMax.min[1] = dot.attr('cy');
  curMinMax.min[2] = dot.attr('r');
  curMinMax.min[3] = dot.attr('fill');

  dot = d3.select('#' + city + ' .minT text');

  curMinMax.min[4] = dot.attr('x');
  curMinMax.min[5] = dot.attr('y');
  curMinMax.min[6] = dot.attr('fill');
  curMinMax.min[7] = dot.text();

  dot = d3.select('#' + city + ' .maxDot');

  curMinMax.max[0] = dot.attr('cx');
  curMinMax.max[1] = dot.attr('cy');
  curMinMax.max[2] = dot.attr('r');
  curMinMax.max[3] = dot.attr('fill');

  dot = d3.select('#' + city + ' .maxT text');

  curMinMax.max[4] = dot.attr('x');
  curMinMax.max[5] = dot.attr('y');
  curMinMax.max[6] = dot.attr('fill');
  curMinMax.max[7] = dot.text();

  dot = d3.select('#' + city + ' .curDot');

  curMinMax.cur[0] = dot.attr('cx');
  curMinMax.cur[1] = dot.attr('cy');
  curMinMax.cur[2] = dot.attr('r');
  curMinMax.cur[3] = dot.attr('fill');

  dot = d3.select('#' + city + ' .curT text');

  curMinMax.cur[4] = dot.attr('x');
  curMinMax.cur[5] = dot.attr('y');
  curMinMax.cur[6] = dot.attr('fill');
  curMinMax.cur[7] = dot.text();

}

function placePoints(city, today, min, max, cur, minyear, maxyear) {
  var minT = min;
  var maxT = max;
  var curT = cur;

  if (minT > 0) {
    minT = '+' + minT;
  } else {
    minT += '';
    if (minT !== '0') {
      minT = minT.substr(1, minT.length - 1);
      minT = '−' + minT;
    }
  }
  if (maxT > 0) {
    maxT = '+' + maxT;
  } else {
    maxT += '';
    if (minT !== '0') {
      maxT = maxT.substr(1, maxT.length - 1);
      maxT = '−' + maxT;
    }
  }
  if (curT > 0) {
    curT = '+' + curT;
  } else {
    curT += '';
    if (minT !== '0' && curT !== '0') {
      curT = curT.substr(1, curT.length - 1);
      curT = '−' + curT;
    }
  }

  if (city == 'MSK') {
    curT = curT + '°C сейчас';
    minT = minT + '°C в ' + minyear;
    maxT = maxT + '°C в ' + maxyear;
  } else {
    minT = minT + ' в ' + minyear;
    maxT = maxT + ' в ' + maxyear;
  }

  var dist = 14; //минимальное расстояние между подписями
  var w = 220;
  var h = 100;
  if (city == 'MSK') {
    w = 1000;
    h = 200;
    dist = 23;
  }
  var x = d3.scale
    .linear()
    .range([0, w])
    .domain([0, 366]);

  var y = d3.scale
    .linear()
    .range([0, h])
    .domain(yDomain);

  var minYt = y(min);
  var minY = y(min);
  var maxYt = y(max);
  var maxY = y(max);
  var curYt = y(cur);
  var curY = y(cur);

  //console.log('dist in', city,minYt,curYt,maxYt, curYt-maxYt);
  if ((Math.abs(curYt - maxYt) <= dist) && (curYt - maxYt > 0)) {
    maxYt = curYt - dist;
  }

  if ((Math.abs(minYt - curYt) <= dist) && (minYt - curYt > 0)) {
    minYt = curYt + dist;
  }

  var citySvg = d3.select('#' + city + ' .graph svg');

  citySvg
    .append('circle')
    .attr('class', 'minDot')
    .attr('cx', x(getX(today)))
    .attr('cy', minY)
    .attr('r', 2)
    .attr('fill', clr2(min));

  citySvg
    .append('g')
    .attr('class', 'minT')
    .append('text')
    .attr('x', x(getX(today)) + 4)
    .attr('y', minYt)
    .attr('dy', '.35em')
    .text(minT)
    .attr('fill', clr2(min));

  citySvg
    .append('circle')
    .attr('class', 'maxDot')
    .attr('cx', x(getX(today)))
    .attr('cy', maxY)
    .attr('r', 2)
    .attr('fill', clr2(max));

  citySvg
    .append('g')
    .attr('class', 'maxT')
    .append('text')
    .attr('x', x(getX(today)) + 4)
    .attr('y', maxYt)
    .attr('dy', '.35em')
    .text(maxT)
    .attr('fill', clr2(max));

  citySvg
    .append('circle')
    .attr('class', 'curDot')
    .attr('cx', function () {
      return x(getX(today))
    })
    .attr('cy', curY)
    .attr('r', 2)
    .attr('fill', function () {
      if (cur < min) {
        return clr2(min);
      }
      if (cur > max) {
        return clr2(max);
      }
      return '#000';
    });

  citySvg
    .append('g')
    .attr('class', 'curT')
    .append('text')
    .attr('x', x(getX(today)) + 4)
    .attr('y', curYt)
    .attr('dy', '.35em')
    .text(function () {
      if (cur < min || cur > max) {
        return curT + ' в ' + year;
      }
      return curT;
    })
    .attr('fill', function () {
      if (cur < min) {
        return clr2(min);
      }
      if (cur > max) {
        return clr2(max);
      }
      return '#000';
    });
}

function searchLastDate(data) {
  var maxMonth = 0;
  var maxDay = 0;
  data.forEach(function (d) {
    var month = Number(d.curtime.substr(3, 2));
    var day = Number(d.curtime.substr(0, 2));
    if (month > maxMonth) {
      maxMonth = month;
      maxDay = day;
    }
    else if (month == maxMonth) {
      if (day > maxDay) {
        maxMonth = month;
        maxDay = day;
      }
    }
  });
  if (maxDay < 10) {
    maxDay = '0' + maxDay;
  }
  if (maxMonth < 10) {
    maxMonth = '0' + maxMonth;
  }
  return maxDay + '.' + maxMonth;
}

function drawToday(lastDate) {
  var today = lastDate;

  var curCity;
  for (var city = 0; city < dotCoords.length; city++) {
    curCity = dotCoords[city][0];
    for (var i = 0; i < minMaxCur.length; i++) {
      var m = minMaxCur[i];
      if (m[0] == curCity && m[1] == today) {
        placePoints(m[0], m[1], m[2], m[3], m[4], m[5], m[6]);
        break;
      }
    }
  }
}

queue()
    .defer(d3.csv, 'alldatamin3.csv')
    .defer(d3.csv, year + '.csv')
    .await(dataReady);
function dataReady(error, data, thisYear) {
  getMinMax(data); //вычисляем минимумы и максимумы на каждый день
  drawGraph(data); //рисуем график

  var lastDate = searchLastDate(thisYear);
  getCur(thisYear, minMaxCur); //заполняем текущую температуру
  drawCurrentYear(thisYear);
  drawToday(lastDate);

  $('.loading-cover').fadeOut();
  if (performance) console.log('rendered @', performance.now())
}

$('.cityInfo')
  .mouseover(function () {
    var curCity = $(this).attr('id');
    var $dots = $('.dot');
    for (var i = 0; i < dotCoords.length; i++) {
      if (dotCoords[i][0] == curCity) {
        $dots.css('left', dotCoords[i][1]).css('top', dotCoords[i][2]);
        if (curCity == 'MSK') {
          $dots.css({
            'width': '7px',
            'background': 'url(img/star.png',
            'height': '7px',
            'border-radius': '0px',
            'background-size': '100%'
          });
        }
        break;
      }
    }
    $dots.css('display', 'block');
  })
  .mouseout(function () {
    $('.dot').css({
      'width': '4px',
      'height': '4px',
      'border-radius': '4px',
      'background': '#ff4a4a',
      'display': 'none'
    });
  });

$(document).scroll(function () {
  if (window.pageYOffset > 0) {
    $('.mainheader').css('border-bottom', '1px solid #dadada')
  }

  if (window.pageYOffset == 0) {
    $('.mainheader').css('border-bottom', '1px solid #fff')
  }
});
