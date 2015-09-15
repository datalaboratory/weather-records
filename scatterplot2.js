var months = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var monthnames = ['янв', 'фев', 'марта', 'апр', 'мая', 'июня', 'июля', 'авг', 'сен', 'окт', 'ноя', 'дек'];
var monthnamesFull = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
var dotcoords = [
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
    ['SOC', 1, 31],
    ['SEV', -1, 27]
];
var maxcount, mincount;

var yDomain = [60, -45];

var mouseovercity = ['', ''];

var daysCaption = ['дней', 'день', 'дня', 'дня', 'дня', 'дней', 'дней', 'дней', 'дней', 'дней'];

var offset = 0;

var minmaxcur = [];
var curminmax = {
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
    var min_opacity = 0.2;

    maxcount = -1;
    mincount = 1000000;

    data.forEach(function (d) {
        if (d.tempcount > maxcount) {
            maxcount = d.tempcount
        }
        if (d.tempcount < mincount) {
            mincount = d.tempcount
        }
    });

    return d3.scale.linear()
        .range([min_opacity, 1])
        .domain([mincount, maxcount]);
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

        var clr1 = d3.scale.linear()
            .domain([-45, -2, 10, 45])
            .range(['#2588e3', '#79dee7', '#f9e687', '#ff5959']);

        var clr2 = d3.scale.linear()
            .domain([-45, -2, 10, 45])
            .range(['#27557f', '#3a8fa2', '#d6b40a', '#c60202']);

        //Прицепляем к диву с классом .graph svg-контейнер
        var citySvg = d3.select('#' + city + ' .graph')
            .append('svg')
            .attr('width', w + 40)
            .attr('height', h);
/*

        //рисуем точки на графике распределения
        citySvg.selectAll('circle')
            .data(temps)
            .enter()
            .append('circle')
            .attr('cx', function (d) {
                return x(getX(d.curtime.substr(0, 5)))
            })
            .attr('cy', function (d) {
                return y(d.temp)
            })
            //если дата сегодняшняя и рисуем минимум или максимум — увеличиваем кружок
            .attr('r', r)
            //если дата сегодняшняя и рисуем минимум или максимум — делаем кружок непрозрачным
            .attr('opacity', function (d) {
                return o(Number(d.tempcount));
            })
            //если дата сегодняшняя и рисуем минимум или максимум — красим кружок ярче
            .attr('fill', function (d) {
                return clr1(d.temp);
            })
            .attr('class', 'graph');
*/

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
            var curtime = values.curtime.substr(0, 5);
            var min = Number(values.min);
            var max = Number(values.max);
            var minyear = Number(values.yearmin);
            var maxyear = Number(values.yearmax);

            minmaxcur.push([
                curCity, curtime, min, max, 0, minyear, maxyear
            ])
        }
    }
}

function getCur(data, minmaxcur) {
    data.forEach(function (d) {
        for (var i = 0; i < minmaxcur.length; i++) {
            if (d.city == minmaxcur[i][0] && d.curtime.substr(0, 5) == minmaxcur[i][1]) {
                minmaxcur[i][4] = Number(d.temp);
            }
        }
    });

    return minmaxcur;
}

function placeMousePoints(left, x, data) {
    var minY;
    var maxY;
    var minYt;
    var maxYt;

    var city = data[0];

    var array;
    if (city == 'MSK') {
        array = monthnamesFull;
    } else {
        array = monthnames;
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

    var clr2 = d3.scale.linear()
        .domain([-45, -2, 10, 45])
        .range(['#1f619e', '#35acc6', '#d6b40a', '#c60202']);

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
        .attr('cx', curminmax.min[0])
        .attr('cy', curminmax.min[1])
        .attr('fill', curminmax.min[3]);

    d3.select('#' + city + ' .maxDot')
        .attr('cx', curminmax.max[0])
        .attr('cy', curminmax.max[1])
        .attr('fill', curminmax.max[3]);

    d3.select('#' + city + ' .minT text')
        .attr('x', curminmax.min[4])
        .attr('y', curminmax.min[5])
        .attr('fill', curminmax.min[6])
        .style('text-anchor', 'start')
        .text(curminmax.min[7]);


    d3.select('#' + city + ' .maxT text')
        .attr('x', curminmax.max[4])
        .attr('y', curminmax.max[5])
        .attr('fill', curminmax.max[6])
        .style('text-anchor', 'start')
        .text(curminmax.max[7]);

    d3.select('#' + city + ' .curT text')
        .attr('x', curminmax.cur[4])
        .attr('y', curminmax.cur[5])
        .attr('fill', curminmax.cur[6])
        .attr('id', 'notmouseovertext')
        .style('text-anchor', 'start')
        .text(curminmax.cur[7])
}

function savePoints(city) {
    var dot = d3.select('#' + city + ' .minDot');

    curminmax.min[0] = dot.attr('cx');
    curminmax.min[1] = dot.attr('cy');
    curminmax.min[2] = dot.attr('r');
    curminmax.min[3] = dot.attr('fill');

    dot = d3.select('#' + city + ' .minT text');

    curminmax.min[4] = dot.attr('x');
    curminmax.min[5] = dot.attr('y');
    curminmax.min[6] = dot.attr('fill');
    curminmax.min[7] = dot.text();

    dot = d3.select('#' + city + ' .maxDot');

    curminmax.max[0] = dot.attr('cx');
    curminmax.max[1] = dot.attr('cy');
    curminmax.max[2] = dot.attr('r');
    curminmax.max[3] = dot.attr('fill');

    dot = d3.select('#' + city + ' .maxT text');

    curminmax.max[4] = dot.attr('x');
    curminmax.max[5] = dot.attr('y');
    curminmax.max[6] = dot.attr('fill');
    curminmax.max[7] = dot.text();

    dot = d3.select('#' + city + ' .curDot');

    curminmax.cur[0] = dot.attr('cx');
    curminmax.cur[1] = dot.attr('cy');
    curminmax.cur[2] = dot.attr('r');
    curminmax.cur[3] = dot.attr('fill');

    dot = d3.select('#' + city + ' .curT text');

    curminmax.cur[4] = dot.attr('x');
    curminmax.cur[5] = dot.attr('y');
    curminmax.cur[6] = dot.attr('fill');
    curminmax.cur[7] = dot.text();

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
        if (minT !== '0') {
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
        r = 1.1;
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

    var clr2 = d3.scale.linear()
        .domain([-45, -2, 10, 45])
        .range(['#1f619e', '#35acc6', '#d6b40a', '#c60202']);

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

    if (cur > min) {
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
            .attr('fill', clr2(min))
    }

    if (cur < max) {
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
            .attr('fill', clr2(max))
    }

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
                return curT + ' в 2015';
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
    var maxmonth = 0;
    var maxday = 0;
    data.forEach(function (d) {
        var month = Number(d.curtime.substr(3, 2));
        var day = Number(d.curtime.substr(0, 2));
        if (month > maxmonth) {
            maxmonth = month;
            maxday = day;
        }
        else if (month == maxmonth) {
            if (day > maxday) {
                maxmonth = month;
                maxday = day;
            }
        }
    });
    if (maxday < 10) {
        maxday = '0' + maxday;
    }
    if (maxmonth < 10) {
        maxmonth = '0' + maxmonth;
    }
    return maxday + '.' + maxmonth;
}

function drawToday(lastdate) {
    var today = lastdate;

    var curCity;
    for (var city = 0; city < dotcoords.length; city++) {
        curCity = dotcoords[city][0];
        for (var i = 0; i < minmaxcur.length; i++) {
            var m = minmaxcur[i];
            if (m[0] == curCity && m[1] == today) {
                placePoints(m[0], m[1], m[2], m[3], m[4], m[5], m[6]);
                break;
            }
        }
    }
}

d3.csv('alldatamin3.csv', function (data) {
    getMinMax(data); //вычисляем минимумы и максимумы на каждый день
    drawGraph(data); //рисуем график

    d3.csv('2015.csv', function (data) {
        var lastdate = searchLastDate(data);
        //console.log('thisislastdate', lastdate);
        getCur(data, minmaxcur); //заполняем текущую температуру
        drawCurrentYear(data);
        drawToday(lastdate);
    })
});

$('.graph')
    .mouseout(function () {
        var curCity = $(this).parent().attr('id');

        restorePoints(curCity);
    })
    .mouseover(function (e) {
        var curCity = $(this).parent().attr('id');

        mouseovercity[0] = mouseovercity[1];
        mouseovercity[1] = curCity;

        //группируем данные по городам
        var nested = d3.nest()
            .key(function (d) {
                return d[0];
            });
        nested = nested.entries(minmaxcur);

        //берем данные нужного города
        //исполняем цикл, если мы только что навели на город
        if (mouseovercity[0] != mouseovercity[1]) {
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
        console.log('curdate', date, minmax, curminmax);
    });

$('.cityInfo')
    .mouseover(function () {
        var curCity = $(this).attr('id');
        var $dots = $('.dot');
        for (var i = 0; i < dotcoords.length; i++) {
            if (dotcoords[i][0] == curCity) {
                $dots.css('left', dotcoords[i][1]).css('top', dotcoords[i][2]);
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
