var fs = require('fs');
var http = require('http');
var zlib = require('zlib');
var querystring = require('querystring');
var d3 = require('d3');

var cities = [
  {id: 27612, city: 'MSK'},
  {id: 26063, city: 'SPB'},
  {id: 29638, city: 'NSK'},
  {id: 28440, city: 'EKB'},
  {id: 27459, city: 'NN'},
  {id: 27595, city: 'KAZ'},
  {id: 28645, city: 'CHE'},
  {id: 28698, city: 'OMK'},
  {id: 28900, city: 'SAM'},
  {id: 28722, city: 'UFA'},
  {id: 34730, city: 'ROS'},
  {id: 29570, city: 'KSK'},
  {id: 28224, city: 'PRM'},
  {id: 34560, city: 'VLG'},
  {id: 34123, city: 'VRN'},
  {id: 37171, city: 'SOC'}
];

var date = new Date;
var year = date.getFullYear();

function getTemp(d) {
  return d.temp;
}
function getRoundTemp(d) {
  return Math.round(d.temp);
}

var nest = d3.nest()
  .key(function (d) {
    return d.date
  })
  .rollup(function (ds) {
    var extent = d3.extent(ds, getRoundTemp);
    return {
      mean: Math.round(d3.mean(ds, getTemp)),
      extent: extent
    };
  });

var history;

function getZipRequest(url, cb) {
  console.log('get and unzip', url);
  http.get(url, function (response) {
    var chunks;
    chunks = [];
    response.on('data', function (chunk) {
      chunks.push(chunk);
    });
    response.on('end', function () {
      var body = Buffer.concat(chunks);
      if (response.statusCode == 200) zlib.gunzip(body, cb);
    });
  });
}

var host = 'rp5.ru';

function loadCity(city) {
  var postData = querystring.stringify({
    wmo_id: String(city.id),
    a_date1: "01.01." + year,
    a_date2: '31.12.' + year,
    f_ed3: "10",
    f_ed4: "100",
    f_ed5: "28",
    f_pe: "1",
    f_pe1: "2",
    lng_id: "2"
  });

  var request = http.request({
    method: 'POST',
    host: host,
    path: '/inc/f_archive.php',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  }, function (response) {
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      var match;
      match = chunk.match(/href=([^>]*)/);
      getZipRequest(match[1], function (error, result) {
        var lines;
        lines = result.toString().split('\n').filter(function (line) {
          return line[0] !== '#';
        });
        lines = lines.slice(1);
        var results = lines
          .map(function (line) {
            var data = line.split(';');
            if (data.length < 2) return '';
            if (data[1].length == 0) return '';
            data = data
              .slice(0, 2)
              .map(function (d) {
                if (d == '') return '';
                return d.match(/"([^"]*)"/)[1];
              });
            return data.join(';');
          })
          .filter(function (line) {
            return line.length > 17;
          })
          .map(function (line) {
            var date = line.slice(0, 5);
            var temp = line.slice(line.indexOf(';') + 1);
            return {
              date: date,
              temp: temp
            };
          });
        results = nest.entries(results);

        results.forEach(function (d) {
          var key = city.city + ',' + d.key;
          var ts = d.values.extent;
          history = history.map(function (hLine) {
            if (hLine.indexOf(key) != 0) return hLine;
            var tokens = hLine.split(',');
            if (ts[0] < Number(tokens[6])) {
              console.log(key, tokens[6], 'new min', ts[0]);
              tokens[6] = ts[0];
              tokens[9] = year;
            }
            if (ts[1] > Number(tokens[7])) {
              console.log(key, tokens[7], 'new max', ts[1]);
              tokens[7] = ts[1];
              tokens[8] = year;
            }
            return tokens.join(',');
          });
        });

        fs.appendFile('./2015.csv', results.map(function (d) {
            return [city.city, d.key, d.values.mean].join(',');
          }).join('\n') + '\n');

        setTimeout(nextCity);
      });
    });
  });
  request.write(postData);
  request.end();
}

function nextCity() {
  if (cities.length == 0) {
    fs.writeFile('./alldatamin3.csv', history.join('\n'));
    return;
  }
  var city = cities.shift();
  loadCity(city)
}

fs.readFile('./alldatamin3.csv', function (error, result) {
  history = result.toString().split('\n');
  fs.writeFile('./2015.csv', 'city,curtime,temp\n');
  nextCity();
});