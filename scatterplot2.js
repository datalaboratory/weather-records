months = [31,29,31,30,31,30,31,31,30,31,30,31]
monthnames = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"]
monthnamesFull = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"]
dotcoords = [["MSK",8,18],["SPB",9,13],["NSK",34,35],["EKB",22,27],["NN",13,23],["KAZ",15,25],["CHE",20,31],["OMK",28,33],["SAM",13,28],["UFA",18,28],["ROS",4,28],["KSK",39,35],["PRM",20,26],["VLG",8,29],["VRN",8,25],["SOC",1,31],["SEV",-1,27]];
var maxcount, mincount;

currentDate = "";
mouseovercity = ["",""]

var daysCaption = ["дней", "день", "дня", "дня", "дня", "дней", "дней", "дней", "дней", "дней"]

offset = 0;

minmaxcur = []
curminmax = {min:[0,0,0,"",0,0,"",""],max:[0,0,0,"",0,0,"",""],cur:[0,0,0,"",0,0,"",""]}

function getMouseMinMax(date, array){
	for(i=0; i<array.length; i++){
		if(array[i][1]==date){
			return array[i];
		}
	}
	return -1;
};

function getDateX(x){
	monthCounter = 1;
	for(i=0; i<months.length; i++){
		if(x>months[i]){
			x -= months[i];
			if(i==1){x++;}
			monthCounter++;
		} else {
			break;
		}
	}
	if(monthCounter<10) {monthCounter = "0"+monthCounter;}
	if(x<10) {x = "0"+x}
	return x+"."+monthCounter;
}

//Переводим дату в координату по оси X
function getX(date) {

    curMonth = Number(date.substr(3,2))-1;
    day = Number(date.substr(0,2));

    for(i=0; i<curMonth; i++){
        day += months[i];
    }

    return day;
}

//Рассчитываем какие точки с какой прозрачностью рисовать
//Те, у которых tempcoun больше — менее прозрачные
//Минимальная прозрачность 20%
function establishOpacity(data) {

	min_opacity = 0.2;
	opacity = 100;

	maxcount = -1;
	mincount = 1000000;

	data.forEach(function(d){
		if(d.tempcount > maxcount) {maxcount = d.tempcount}
		if(d.tempcount < mincount) {mincount = d.tempcount}
	})

	return d3.scale.linear().range([min_opacity,1]).domain([mincount,maxcount]);
}

//Возвращает сегодняшнюю дату в формате: DD.MM
function getToday(){
	d = new Date()
	todayDay = d.getDate();
	todayMonth = d.getMonth()+1;

	if(todayDay<10){todayDay = "0"+todayDay;} else {todayDay = ""+todayDay;}
	if(todayMonth<10){todayMonth = "0"+todayMonth;} else {todayMonth = ""+todayMonth;}

	today = todayDay+"."+todayMonth;

	return today;
}

//Вычисляет количество солнечных и количество пасмурных дней
//Солнечный день — когда меньше 20% облаков
//Пасмурный день — когда больше 80% облаков
function getCloudageAndRain(temps){

	//console.log(temps)

	var cloudy=0, sunny=0, rain = 0;
	temps.forEach(function(d){
		rain += Number(d.rain)
		if(Number(d.clouds) > 80){ cloudy++; }
		if(Number(d.clouds) < 20){ if(Number(d.clouds)!= -1){sunny++; }}
	})

	cloudy = Math.round((cloudy/temps.length)*365);
	sunny = Math.round((sunny/temps.length)*365);
	rain = Math.round((rain/119)*12);

	return {cloudy: cloudy, sunny: sunny, rain: rain};
}

//Рисует весь график, заполняет фактоиды
function drawGraph(data) {

	//считаем с какой прозрачностью надо рисовать точки
	o = establishOpacity(data);
	mos_o = d3.scale.linear().range([0.35,1]).domain([mincount,maxcount]); //для москвы чуть менее прозрачные точки

	today = getToday(); //запоминаем сегодняшнюю дату

	//группируем данные по городам
	var nested = d3.nest()	
					.key(function(d) { return d.city;});
	nested = nested.entries(data);

	//рисуем график для каждого города
	nested.forEach(function(d){
		city = d.key; //текущий город
		temps = d.values; //все данные о температурах в текущем городе

		//считаем количество пасмурных, солнечных дней и осадков
		//и заполняем фактоиды
		factoids = getCloudageAndRain(temps);
		$("#"+city+" .sun").html(factoids.sunny);
		$("#"+city+" .clouds").html(factoids.cloudy);
		$("#"+city+" .rain").html(factoids.rain)
		$("#"+city+" .daysCaption1").html(function(){return daysCaption[factoids.cloudy%10];});
		$("#"+city+" .daysCaption2").html(function(){return daysCaption[factoids.sunny%10];});

		//задаем размеры графика и радиус кружка
		//для Москвы всё больше
		w = 220;
		h = 100;
		r = 0.6;
		if(city=="MSK") {w=1000; h=200; r=1.1;};

		var x = 	d3	.scale
    				.linear()
    				.range([0,w])
    				.domain([0,366]);

	    var y = 	d3	.scale
	    				.linear()
	    				.range([0, h])
	    				.domain([45,-45]);



		var clr0 =	d3	.scale.linear()
						.domain([-45,0,45])
						.range(['#99d8ff', '#f6eaa3', '#ffa5a4']);
	    //цвет основного графика — светлый
	    var clr1_OLD =	d3	.scale.linear()
						.domain([-45,0,45])
						.range(['#73c8fd', '#f6e26f', '#ff7674']);

		 var clr1_VAR =	d3	.scale.linear()
						.domain([-45,-10,0,10,45])
						.range(['#74c9fd','#aff8f5', '#f6e9a7','#ffd8af', '#fc8585']);

		var clr1 =		d3	.scale.linear()
						.domain([-45,-2,10,45])
						.range(['#2588e3','#79dee7', '#f9e687', '#ff5959']);

		//цвет минимума и максимума — темный
		var clr3 =	d3	.scale.linear()
						.domain([-45,0,45])
						.range(['#3a99d5', '#fbdc2a', '#ff3d3b']);

		var clr2 =		d3	.scale.linear()
						.domain([-45,-2,10,45])
						.range(['#27557f','#3a8fa2', '#d6b40a', '#c60202']);	

		//Прицепляем к диву с классом .graph svg-контейнер
		svg = 	d3.select("#"+city+" .graph")
					.append("svg")
					.attr("width", w+40)
                	.attr("height", h);

                	/*

        var yAxis = d3.svg.axis().scale(y).ticks(7).orient("left");
	    
	    	svg.append("g")
			      .attr("class", "y axis")
			      .attr("transform", "translate(" + 10 + ",0)")
			      .call(yAxis);

*/
        var mindump, maxdump;
        //рисуем точки на графике распределения
		svg			.selectAll("circle")
					.data(temps)
					.enter()
					.append("circle")
					.attr("cx", function(d){return x(getX(d.curtime.substr(0,5)))})
					.attr("cy", function(d){return y(d.temp)})
					//если дата сегодняшняя и рисуем минимум или максимум — увеличиваем кружок
					.attr("r", function(d){
						/*
						if(d.temp == d.min && d.curtime == today) {
								addMinMaxCur(d.city,d.temp,"min");
								mindump = {temp: d.temp, curtime: d.curtime};
								return 2;
						}
						if(d.temp == d.max && d.curtime == today) {
								addMinMaxCur(d.city,d.temp,"max");
								maxdump = {temp: d.temp, curtime: d.curtime};
								return 2;
						}
						*/
						
						return r;
					})
					//если дата сегодняшняя и рисуем минимум или максимум — делаем кружок непрозрачным
					.attr("opacity",function(d){
						/*
						if(d.temp == d.min || d.temp==d.max) {
							if(d.curtime == today) {
								return 1;
							}
						}
						if(d.city == "MSK") {return mos_o(Number(d.tempcount));} //если москва, используем другую прозрачность
						*/
						return o(Number(d.tempcount));
					})
					//если дата сегодняшняя и рисуем минимум или максимум — красим кружок ярче
					.attr("fill", function(d){
						/*
						if(d.temp == d.min || d.temp==d.max) {
							if(d.curtime == today) {
								return clr2(d.temp);
							}
						}
						*/
						return clr1(d.temp);
					})
					.attr("class", function(d){
						/*
						if(d.temp == d.min && d.curtime == today) {return "minval";}
						if(d.temp == d.max && d.curtime == today) {return "maxval";}
						*/
						return "graph";
					});

		 svg  = 		d3.select("#"+city+" .graph svg")
					.append("rect")
					.attr("x",0)
					.attr("y",y(0))
					.attr("width", w)
					.attr("height",1)
					.attr("fill",function(){return clr2(0);})
					.attr("opacity",0.3)


		if(city=="MSK"){
			svg  = 		d3.select("#"+city+" .graph svg")
						.append("text")
						.attr("class","zero")
						.attr("x",x(368))
						.attr("y",y(0))
						.text("0°С")
						.attr("dy", ".35em")
						.attr("fill",function(){return clr2(0);});
		}




/*
		svg = 	d3.select("#"+city+" .graph svg")
					.append("g")
					.append("text")
					.attr("x", function(){return x(getX(mindump.curtime))+4})
					.attr("y", function(){return y(mindump.temp)-1})
					.attr("dy", ".35em")
					.text(function(){
						if(Number(mindump.temp)>0) {return "+"+mindump.temp;}
						return mindump.temp;
					})
					.attr("fill", function(){return clr2(mindump.temp)})

		svg = 	d3.select("#"+city+" .graph svg")
					.append("g")
					.append("text")
					.attr("x", function(){return x(getX(maxdump.curtime))+4})
					.attr("y", function(){return y(maxdump.temp)-1})
					.attr("dy", ".35em")
					.text(function(){
						if(Number(maxdump.temp)>0) {return "+"+maxdump.temp;}
						return maxdump.temp;
					})
					.attr("fill", function(){return clr2(maxdump.temp)})
					*/

	})
	//console.log(minmaxcur);

}

function drawCurrentYear(data) {

	w = 220;
	h = 100;
	r = 0.6;

	var nested = d3.nest()
                 .key(function(d) { return d.city; })

	nested = nested.entries(data);

	

	for(city=0; city < nested.length; city++){
		curCity = nested[city].key;
		tempData = nested[city].values;

		if(curCity=="MSK") {w=1000; h=200; r=1.25;}
		else {w=220; h=100; r=0.75;}

		var x = 	d3	.scale
    				.linear()
    				.range([0,w])
    				.domain([0,366]);

	    var y = 	d3	.scale
	    				.linear()
	    				.range([0, h])
	    				.domain([45,-45]);

	    var line=	d3.svg.line()
	    				.interpolate("basis") 
	    				.x(function(d){return x(getX(d.curtime.substr(0,5)))})
	    				.y(function(d){return y(d.temp)})

		//console.log("current city", curCity);
		//console.log("current data", tempData);

		svg = 	d3.select("#"+curCity+" .graph svg");

		//console.log("svg current temp", svg);

		svg		.append("g")
				.attr("class","currentTemps");

		svg 	.append("path")
				.datum(tempData)
				.attr("class","line")
				.attr("d", line);

		/*
		//Точечный график текущей температуры

		svg		.selectAll(".currentTemps")
				.selectAll("circle")
				.data(tempData)
				.enter()
				.append("circle")
				.attr("cx",function(d){
					return x(getX(d.curtime.substr(0,5)));
				})
				.attr("cy", function(d){
					return y(d.temp);
				})
				.attr("r",r);

				*/

	}
	
}

function writeToday(){
	today = getToday();
	day = Number(today.substr(0,2))
	month = Number(today.substr(3,2))-1;

	str = day+" "+monthnames[month];

	//$(".curdate").html(str);

	return str;
}

function getMinMax(data){

	var nested = d3.nest()	
					.key(function(d) { return d.city;})
					.key(function(d) { return d.curtime.substr(0,5);})
	nested = nested.entries(data);

	for(city=0; city<nested.length; city++){
		curCity = nested[city].key;
		daysData = nested[city].values;

		for(day=0; day<daysData.length; day++) {
			curtime = daysData[day].values[0].curtime.substr(0,5);
			min = Number(daysData[day].values[0].min);
			max = Number(daysData[day].values[0].max);
			minyear = Number(daysData[day].values[0].yearmin);
			maxyear = Number(daysData[day].values[0].yearmax);

			minmaxcur.push([curCity,curtime,min,max,0,minyear,maxyear])
		}
	}
}

function getCur(data, minmaxcur){

	data.forEach(function(d){
		for(i=0; i<minmaxcur.length; i++){
			if(d.city==minmaxcur[i][0] && d.curtime.substr(0,5) == minmaxcur[i][1]){
				minmaxcur[i][4] = Number(d.temp);
			}
		}
	})

	return minmaxcur;
}

function placeMousePoints(left,x,data){

	minY =0; maxY =0; minYt=0; maxYt=0;

	city = data[0];

	if(city=="MSK"){
		curT = Number(data[1].substr(0,2))+" "+monthnamesFull[Number(data[1].substr(3,2))-1];
	}
		else {
			curT = Number(data[1].substr(0,2))+" "+monthnames[Number(data[1].substr(3,2))-1];
		}

	minT = Number(data[2]); maxT = Number(data[3]);

	//прилепляем — или + к рекордам
	if(minT > 0) {minT = "+"+minT;} else {minT+=""; if(minT!=="0") {minT = minT.substr(1,minT.length-1); minT = "−"+minT;} };
	if(maxT > 0) {maxT = "+"+maxT;} else {maxT+=""; if(minT!=="0") {maxT = maxT.substr(1,maxT.length-1); maxT = "−"+maxT;} };

	if(city=="MSK") {
		minT = minT+"°C в "+data[5];
		maxT = maxT+"°C в "+data[6];
	} else {
		minT = minT+" в "+data[5];
		maxT = maxT+" в "+data[6];
	}

	dist = 14; //минимальное расстояние между подписями

	w = 220;
	h = 100;
	if(city=="MSK") {w=1000; h=200; r=1.1; dist = 23;};


	var y = 	d3	.scale
	    		.linear()
	    		.range([0, h])
	    		.domain([45,-45]);

	var clr2 =		d3	.scale.linear()
						.domain([-45,-2,10,45])
						.range(['#1f619e','#35acc6', '#d6b40a', '#c60202']);

	minYt = y(data[2]); minY=y(data[2]);
	maxYt = y(data[3]); maxY=y(data[3]);

	curYt = (maxYt+minYt)/2; curY=(maxY+minY)/2;

	//curYt = maxYt-23; curY=maxY-23;

	if( (Math.abs(curYt-maxYt) <= dist) && (curYt-maxYt > 0) ) {
		//maxYt = curYt-dist;
	}
	else if ((Math.abs(curYt-maxYt) <= dist) && (curYt-maxYt < 0)) {
		//curYt = maxYt-dist;
	}

	if( (Math.abs(minYt-curYt) <= dist) && (minYt-curYt > 0) ) {
		//minYt = curYt+dist;
	}
	else if ((Math.abs(minYt-curYt) <= dist) && (minYt-curYt < 0)) {
		//curYt = minYt+dist;
	}
	
	d3.select("#"+city+" .minDot")
				.attr("cx",x-left)
				.attr("cy",minY)
				.attr("fill",function(){return clr2(data[2])})

	d3.select("#"+city+" .maxDot")
				.attr("cx",x-left)
				.attr("cy",maxY)
				.attr("fill",function(){return clr2(data[3])})

				

	d3.select("#"+city+" .minT text")
				.attr("x",function(){
					if(city=="MSK" && x-left>907){
						return x-left-4;
					} else if (city!="MSK" && x-left>163) {
						return x-left-4;
					} else {
						return x-left+4;
					}
				})
				.attr("y",minYt)
				.attr("fill",function(){return clr2(data[2])})
				.style("text-anchor",function(){
					if(city=="MSK" && x-left>907){
						return "end";
					} else if (city!="MSK" && x-left>163) {
						return "end";
					} else {
						return "start";
					}
				})
				.text(minT)


	d3.select("#"+city+" .maxT text")
				.attr("x",function(){
					if(city=="MSK" && x-left>907){
						return x-left-4;
					} else if (city!="MSK" && x-left>163) {
						return x-left-4;
					} else {
						return x-left+4;
					}
				})
				.attr("y",maxYt)
				.attr("fill",function(){return clr2(data[3])})
				.style("text-anchor",function(){
					if(city=="MSK" && x-left>907){
						return "end";
					} else if (city!="MSK" && x-left>163) {
						return "end";
					} else {
						return "start";
					}
				})
				.text(maxT)

	if(city=="MSK"){
		yMargin = 18;
	} else {
		yMargin = 11;
	}
	console.log(city,yMargin)
	d3.select("#"+city+" .curT text")
				.attr("x",function(){
					if(city=="MSK" && x-left>907){
						return x-left-4;
					} else if (city!="MSK" && x-left>163) {
						return x-left-4;
					} else {
						if(city=="MSK"){
							return x-left+13;
						} else {
							return x-left+11;
						}
					}
				})
				.attr("y",maxYt-yMargin)
				.attr("fill","#000")
				.style("text-anchor",function(){
					if(city=="MSK" && x-left>907){
						return "end";
					} else if (city!="MSK" && x-left>163) {
						return "end";
					} else {
						return "start";
					}
				})
				.text(curT)
				.attr('id','mouseovertext');


}

function restorePoints(city){
	d3.select("#"+city+" .minDot")
				.attr("cx",curminmax.min[0])
				.attr("cy",curminmax.min[1])
				.attr("fill",curminmax.min[3])

	d3.select("#"+city+" .maxDot")
				.attr("cx",curminmax.max[0])
				.attr("cy",curminmax.max[1])
				.attr("fill",curminmax.max[3])

	d3.select("#"+city+" .minT text")
				.attr("x",curminmax.min[4])
				.attr("y",curminmax.min[5])
				.attr("fill",curminmax.min[6])
				.style("text-anchor","start")
				.text(curminmax.min[7])


	d3.select("#"+city+" .maxT text")
				.attr("x",curminmax.max[4])
				.attr("y",curminmax.max[5])
				.attr("fill",curminmax.max[6])
				.style("text-anchor","start")
				.text(curminmax.max[7])

	d3.select("#"+city+" .curT text")
				.attr("x",curminmax.cur[4])
				.attr("y",curminmax.cur[5])
				.attr("fill",curminmax.cur[6])
				.attr('id','notmouseovertext')
				.style("text-anchor","start")
				.text(curminmax.cur[7])
}

function savePoints(city){
	var dot = d3.select("#"+city+" .minDot");

	curminmax.min[0] = dot.attr("cx");
	curminmax.min[1] = dot.attr("cy");
	curminmax.min[2] = dot.attr("r");
	curminmax.min[3] = dot.attr("fill");

	dot = d3.select("#"+city+" .minT text");

	curminmax.min[4] = dot.attr("x");
	curminmax.min[5] = dot.attr("y");
	curminmax.min[6] = dot.attr("fill");
	curminmax.min[7] = dot.text();

	dot = d3.select("#"+city+" .maxDot");

	curminmax.max[0] = dot.attr("cx");
	curminmax.max[1] = dot.attr("cy");
	curminmax.max[2] = dot.attr("r");
	curminmax.max[3] = dot.attr("fill");

	dot = d3.select("#"+city+" .maxT text");

	curminmax.max[4] = dot.attr("x");
	curminmax.max[5] = dot.attr("y");
	curminmax.max[6] = dot.attr("fill");
	curminmax.max[7] = dot.text();

	dot = d3.select("#"+city+" .curDot");

	curminmax.cur[0] = dot.attr("cx");
	curminmax.cur[1] = dot.attr("cy");
	curminmax.cur[2] = dot.attr("r");
	curminmax.cur[3] = dot.attr("fill");

	dot = d3.select("#"+city+" .curT text");

	curminmax.cur[4] = dot.attr("x");
	curminmax.cur[5] = dot.attr("y");
	curminmax.cur[6] = dot.attr("fill");
	curminmax.cur[7] = dot.text();

}

function placePoints(city,today,min,max,cur,minyear,maxyear){

	//console.log("minimumsmaximums", city,min,max);

	minT = min; maxT = max; curT = cur;
	var mouseoverMinT, mouseoverMaxT;

	if(minT > 0) {minT = "+"+minT;} else {minT+=""; if(minT!=="0") {minT = minT.substr(1,minT.length-1); minT = "−"+minT;} };
	if(maxT > 0) {maxT = "+"+maxT;} else {maxT+=""; if(minT!=="0") {maxT = maxT.substr(1,maxT.length-1); maxT = "−"+maxT;} };
	if(curT > 0) {curT = "+"+curT;} else {curT+=""; if(minT!=="0") {curT = curT.substr(1,curT.length-1); curT = "−"+curT;} };

		
	if(city=="MSK") {
		curT = curT+"°C сейчас";
		minT = minT+"°C в "+minyear;
		maxT = maxT+"°C в "+maxyear;
	} else {
		minT = minT+" в "+minyear;
		maxT = maxT+" в "+maxyear;
	}


	dist = 14; //минимальное расстояние между подписями

	w = 220;
	h = 100;
	if(city=="MSK") {w=1000; h=200; r=1.1; dist = 23;};

	var x = 	d3	.scale
    			.linear()
    			.range([0,w])
    			.domain([0,366]);

	var y = 	d3	.scale
	    		.linear()
	    		.range([0, h])
	    		.domain([45,-45]);


	var clr2 =		d3	.scale.linear()
						.domain([-45,-2,10,45])
						.range(['#1f619e','#35acc6', '#d6b40a', '#c60202']);	

	var clr2_OLD =	d3	.scale.linear()
				.domain([-45,0,45])
				.range(['#0068ab', '#e79e00', '#c20200']);

	var clr3 =	d3	.scale.linear()
				.domain([-45,0,45])
				.range(['#147dc0', '#d1a803', '#f22220']);

	minYt = y(min); minY=y(min);
	maxYt = y(max); maxY=y(max);
	curYt = y(cur); curY=y(cur);

	//console.log("dist in", city,minYt,curYt,maxYt, curYt-maxYt);
	if( (Math.abs(curYt-maxYt) <= dist) && (curYt-maxYt > 0) ) {
		maxYt = curYt-dist;
	}
	else if ((Math.abs(curYt-maxYt) <= dist) && (curYt-maxYt < 0)) {
		//curYt = maxYt-dist;
	}

	if( (Math.abs(minYt-curYt) <= dist) && (minYt-curYt > 0) ) {
		minYt = curYt+dist;
	}
	else if ((Math.abs(minYt-curYt) <= dist) && (minYt-curYt < 0)) {
		//curYt = minYt+dist;
	}
	/*
	if(Math.abs(curYt-minYt) <= dist) {
		if(curYt > minYt) {minYt = curYt+dist}
			else {curYt = minYt+dist}
	}
	*/

	if(cur > min){
	svg = 	d3.select("#"+city+" .graph svg")
					.append("circle")
					.attr("class","minDot")
					.attr("cx", function(d){return x(getX(today))})
					.attr("cy", minY)
					.attr("r", 2)
					.attr("fill", function(){return clr2(min)});

	svg = 	d3.select("#"+city+" .graph svg")
					.append("g")
					.attr("class","minT")
					.append("text")
					.attr("x", function(d){return x(getX(today))+4})
					.attr("y", minYt)
					.attr("dy", ".35em")
					.text(minT)
					.attr("fill", function(){return clr2(min)})

	}
					
	if(cur < max) {
	svg = 	d3.select("#"+city+" .graph svg")
					.append("circle")
					.attr("class","maxDot")
					.attr("cx", function(d){return x(getX(today))})
					.attr("cy", maxY)
					.attr("r", 2)
					.attr("fill", function(){return clr2(max)});

	svg = 	d3.select("#"+city+" .graph svg")
					.append("g")
					.attr("class","maxT")
					.append("text")
					.attr("x", function(d){return x(getX(today))+4})
					.attr("y", maxYt)
					.attr("dy", ".35em")
					.text(maxT)
					.attr("fill", function(){return clr2(max)})

	}
			

	svg = 	d3.select("#"+city+" .graph svg")
					.append("circle")
					.attr("class","curDot")
					.attr("cx", function(d){return x(getX(today))})
					.attr("cy", curY)
					.attr("r", 2)
					.attr("fill", function(){
						if(cur < min) { return clr2(min);}
						if(cur > max) { return clr2(max);}
						return "#000";
					})

	svg = 	d3.select("#"+city+" .graph svg")
					.append("g")
					.attr("class","curT")
					.append("text")
					.attr("x", function(d){return x(getX(today))+4})
					.attr("y", curYt)
					.attr("dy", ".35em")
					.text(function(){
						if(cur < min || cur > max){ return curT+" в 2015";}
						return curT;
					})
					.attr("fill", function(){
						if(cur < min) { return clr2(min);}
						if(cur > max) { return clr2(max);}
						return "#000";
					});




}

function searchLastDate(data){
	maxmonth = 0;
	maxday = 0;
	i=0;
	data.forEach(function(d){
		//console.log(d.curtime);
		month = Number(d.curtime.substr(3,2));
		day =  Number(d.curtime.substr(0,2));

		//console.log(day,month)
		if(month > maxmonth) {
			maxmonth = month;
			maxday = day;
		}
		else if(month == maxmonth){
			if(day > maxday){
				maxmonth = month;
				maxday = day;
			}
		}
	})
	if(maxday < 10) {maxday = "0"+maxday;}
	if(maxmonth < 10) {maxmonth = "0"+maxmonth;}
	maximumdate = maxday+"."+maxmonth;
	return maximumdate;
}

function drawToday(lastdate){
	today = lastdate;

	for(city=0; city<dotcoords.length; city++){
		curCity = dotcoords[city][0];
		//console.log("searching minmax in", curCity);

		for(i=0; i<minmaxcur.length; i++){
			if(minmaxcur[i][0]==curCity && minmaxcur[i][1]==today){
				placePoints(minmaxcur[i][0],minmaxcur[i][1],minmaxcur[i][2],minmaxcur[i][3],minmaxcur[i][4],minmaxcur[i][5],minmaxcur[i][6]);
				break;
			}
		}
	}
}

d3.csv('alldatamin3.csv', function (data) {

	currentDate = writeToday(); //подписываем дату в заголовке

	getMinMax(data); //вычисляем минимумы и максимумы на каждый день
	drawGraph(data); //рисуем график

	//prepareData(data);

	//prepareDataForGraph(data);

	//showWeather();

	d3.csv('2015.csv', function(data){
		lastdate = searchLastDate(data);
		//console.log("thisislastdate", lastdate);
		getCur(data, minmaxcur); //заполняем текущую температуру
		drawCurrentYear(data);
		drawToday(lastdate);


	})
});

$(".graph").mouseout(function(e){
	curCity = $(this).parent().attr("id");

	restorePoints(curCity);
});

$(".graph").mouseover(function(e){
	curCity = $(this).parent().attr("id");

	mouseovercity[0] = mouseovercity[1];
	mouseovercity[1] = curCity;

	//группируем данные по городам
	var nested = d3.nest()	
					.key(function(d) { return d[0];});
	nested = nested.entries(minmaxcur);

	//берем данные нужного города
	//исполняем цикл, если мы только что навели на город
	if(mouseovercity[0]!=mouseovercity[1]){
		for(i=0; i<nested.length; i++){
			if(nested[i].key==curCity){
				cityData = nested[i].values;
			}
		}
		//console.log("mouseover nested", cityData)
	};

	//определяем координаты X у графика
	leftX = $(this).offset().left;
	width = $(this).css("width");
	px = width.indexOf("px");
	width = Number(width.substr(0,px));
	rightX = leftX + width;

	x = e.pageX;
	if(x > rightX) {x = rightX};

	day = Math.round(((x-leftX)/(rightX-leftX))*365)
	if(day==0){day=1}

	date = getDateX(day);
	minmax = getMouseMinMax(date, cityData);

	savePoints(curCity);
	placeMousePoints(leftX,x,minmax);

	console.log("curdate",date, minmax, curminmax);
		
})

$(".cityInfo").mouseover(function(){
	curCity = $(this).attr("id");
	for(i=0; i<dotcoords.length; i++){
		if(dotcoords[i][0]==curCity){
			$(".dot").css("left",dotcoords[i][1]).css("top",dotcoords[i][2]);
			if(curCity=="MSK") {
				$(".dot").css("width","7px");
				$(".dot").css("background","url(img/star.png)");
				$(".dot").css("height","7px");
				$(".dot").css("border-radius","0px");
				$(".dot").css("background-size","100%");
			}
			break;
		}
	}
	$(".dot").css("display","block");

})
$(".cityInfo").mouseout(function(){
	$(".dot").css("width","4px");
	$(".dot").css("height","4px");
	$(".dot").css("border-radius","4px");
	$(".dot").css("background","#ff4a4a");
	$(".dot").css("display","none");
})

$(document).scroll(function(){

	if(window.pageYOffset > 0) {
		$(".mainheader").css("border-bottom","1px solid #dadada")
	}

	if(window.pageYOffset == 0) {
		$(".mainheader").css("border-bottom","1px solid #fff")
	}

})
