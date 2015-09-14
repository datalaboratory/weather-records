<html>
<head>
</head>
<body>
<?php

	$doc = new DOMDocument();
	$fp = fopen('svetosilru/temp/2016.csv', 'a');  //открываем файл на добавление

	$months = array("January"=>"01","February"=>"02","March"=>"03","April"=>"04","May"=>"05","June"=>"06","July"=>"07","August"=>"08","September"=>"09","October"=>"10","November"=>"11","December"=>"12");
	$cities = array("MSK","SPB","NSK","EKB","NN","KAZ","CHE", "OMK", "SAM", "UFA", "ROS", "KSK");
	$woeids = array("2122265", "2123260", "2122541", "12599353", "2052932", "2121267", "12598116", "12516609", "2077746", "12597273", "2123177", "12597862");

	$today = getdate();
	$curmonth = $months[$today['month']];
	$curday = $today['mday'];

	if($curday<10) {
		$curday = "0".$curday;
	};

	$currentdate = $curday.".".$curmonth;

	for($i=0; $i<sizeof($woeids); $i++) {
		$doc->load('http://weather.yahooapis.com/forecastrss?w='.$woeids[$i].'&u=c');
		$channel = $doc->getElementsByTagName("channel");
		foreach($channel as $chnl)
		{
			$item = $chnl->getElementsByTagName("item");
			foreach($item as $itemgotten)
			{	
				$curtemp = $itemgotten->getElementsByTagName("condition")->item(0)->getAttribute("temp");
				$writestring = $cities[$i].",".$currentdate.",".$curtemp."\n";
				echo $writestring;
				$test = fwrite($fp, $writestring);
				if ($test) //echo 'Я заснял, я заснял!';
				;
			};
		};
	};

?>
</body>
</html>