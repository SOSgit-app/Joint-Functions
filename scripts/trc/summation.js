function CellMap() {
}
CellMap.map = new Object();
CellMap.addMapping = function(declName, codeName) {
	CellMap.map[declName] = codeName;
}
CellMap.getMapping = function(declName) {
	var v = CellMap.map[declName];
	return (v == null) ? declName : v;
}

// Debug functions
function LogWrite(msg) {
	var log = document.getElementById("__log__");
	if (log == null) {
		log = document.body.appendChild(document.createElement("div"));
		log.setAttribute("id", "__log__");
	}
	log.appendChild(document.createTextNode(msg));
	log.appendChild(document.createElement("br"));
}

// --------------------------------------------------------------------------------
// Class MathFunction
// --------------------------------------------------------------------------------
function MathFunction(func, totalFunc, format, result) {
	if (arguments.length != 0) {
		this.totalFunc = totalFunc;
		this.format = format;			// Override formatting function
		this.init(func, result, MathFunction.tailArgs(arguments, 4));
	}
}
MathFunction.prototype.totalFunc = null;
MathFunction.prototype.roundPlaces = 2;
MathFunction.prototype.format = null;

MathFunction.prototype.calc = function(force) {
	if (MathFunction.calced == null)
		MathFunction.calced = new Object();
	
	if (this.result == null) {
		LogWrite("this.result is null");
		return;
	}

	var calced = false;		
	if (force == true || MathFunction.calced[this.result.id] == null || MathFunction.calced[this.result.id] == false) {
		MathFunction.calced[this.result.id] = true;
		
		var result = this.aggregate();
		
		// Round the result
		if (this.totalFunc != null)
			result = this.totalFunc(result);
			
		// Format the result
		if (this.format != null)
			result = this.format(result);
		else
			result = this.defaultFormat(result);
		
		// Set the result
		this.setElementValue(this.result, result);
			
		// Chain react
		MathFunction.calcBinding(this.result, true);
		
		calced = true;
	}
}

MathFunction.prototype.getElement = function(id) {
	// Map the name	
	var mapping = CellMap.getMapping(id);
	var a = document.getElementsByName(mapping);
	if (a != null && a.length != 0)
		return a[0];
	// Try the lookup by ID (for non IE windows)
	a = document.getElementById(mapping);
	return a;
}

MathFunction.prototype.getElementValue = function(obj) {
	if (obj != null) {
	    var s;
		if (obj.nodeName.toLowerCase() == "input")
			s = obj.value;
		else
			s = obj.innerHTML;
		
		// strip dollar signs and commas
		var newS = s.replace(/[\$,]/g, "");
		
		// parse the result
		return parseFloat(newS);
	}
}

MathFunction.prototype.setElementValue = function(obj, value) {
	if (obj != null) {
		if (obj.nodeName.toLowerCase() == "input")
			obj.value = value;
		else
			obj.innerHTML = value;
	}
}

MathFunction.prototype.init = function(func, result, depends) {
	this.func = func;
	this.result = this.getElement(result);
	if (this.result == null) {
		LogWrite("Can't find result object: " + result);
		return;
	}
	
	if (this.result.id == null)
		LogWrite("Result object missing an id: " + result);
	dependencies = new Array();
	var j = 0;
	for (var i = 0; i < depends.length; i++) {
		obj = this.getElement(depends[i]);
		if (obj == null) {
			LogWrite("Can't find dependent object: " + depends[i]);
		}
		else {
			//LogWrite("Binding to dependent: " + obj.nodeName);
			if (obj.nodeName.toLowerCase() == "input") {
				obj.onblur = MathFunction.calcHandler;
			}
			dependencies[j] = obj;
			j++;
		}
	}
	this.dependencies = dependencies;
}

MathFunction.prototype.defaultFormat = function (x) {
	// Round the result to n places
	if (this.roundPlaces == 0)
		return x.toString();
	var s = Math.round(x * Math.pow(10, this.roundPlaces)).toString();
	while (s.length < this.roundPlaces + 1)
		s = "0" + s;
	return s.slice(0,-this.roundPlaces) + "." + s.slice(-this.roundPlaces);
};

MathFunction.prototype.aggregate = function() {
	var result = 0;
	var v;
	var first = true;
	for (var i in this.dependencies) {
		v = this.getElementValue(this.dependencies[i]);
		
		if (isNaN(v))
			v = 0;		

		if (first) {
			result = v;
			first = false;
		}
		else {
			result = this.func(result, v);
		}
	}
	return result;
}

MathFunction.bind = function(funcs) {
	MathFunction.binding = new Object();

	// Bind all the dependency object
	for (var i = 0; i < funcs.length; i++) {
		for (j = 0; j < funcs[i].dependencies.length; j++) {
			var a = MathFunction.binding[funcs[i].dependencies[j].id];
			if (a == null) {
				a = new Array();
				MathFunction.binding[funcs[i].dependencies[j].id] = a;
			}
			a[a.length] = funcs[i];		
		}
	}
	
	// Perform the initial calculation by calcing everything at least once
	MathFunction.calced = null;
	for (i in funcs) {
		funcs[i].calc();
	}
}

MathFunction.calcBinding = function(obj, force) {
	if (obj != null) {
		var a = MathFunction.binding[obj.id];
		if (a != null) {
			for (var i = 0; i < a.length; i++) {
				a[i].calc(force);
			}
		}
	}
}

MathFunction.calcHandler = function() {
	MathFunction.calced = null;
	MathFunction.calcBinding(window.event.srcElement);
}

MathFunction.tailArgs = function(args, start) {
	var newArgs = Array(args.length - start);
	for (var i = start, j=0; i < args.length; i++, j++)
		newArgs[j] = args[i];
	return newArgs;
}


// Backward compatibility function
function BindSums(sums) {
	MathFunction.bind(sums);
}


// -----------------------------------------------------------------------------
// Predefined functions "derived" from MathFunction
// -----------------------------------------------------------------------------

// Summation 
function Summation(result) {
	this.init(function(x,y) {return (x+y)}, result, MathFunction.tailArgs(arguments,1));
}
Summation.prototype = new MathFunction();
Summation.prototype.constructor = Summation;

// IntSummation 
function IntSummation(result) {
	this.init(function(x,y) {return (Math.floor(x)+Math.floor(y))}, result, MathFunction.tailArgs(arguments,1));
}
IntSummation.prototype = new MathFunction();
IntSummation.prototype.constructor = Summation;
IntSummation.prototype.roundPlaces = 0;
IntSummation.prototype.totalFunc = Math.floor;

// Subtraction 
function Subtraction(result) {
	this.init(function(x,y) {return (x-y);}, result, MathFunction.tailArgs(arguments,1));
}
Subtraction.prototype = new MathFunction();
Subtraction.prototype.constructor = Subtraction;

// IntSubtraction 
function IntSubtraction(result) {
	this.init(function(x,y) {return (x-y);}, result, MathFunction.tailArgs(arguments,1));
}
IntSubtraction.prototype = new MathFunction();
IntSubtraction.prototype.constructor = Subtraction;
IntSubtraction.prototype.roundPlaces = 0;
IntSubtraction.prototype.totalFunc = Math.floor;

// Multiplication 
function Multiplication(result) {
	this.init(function(x,y) {return (x*y);}, result, MathFunction.tailArgs(arguments,1));
}
Multiplication.prototype = new MathFunction();
Multiplication.prototype.constructor = Multiplication;

// IntMultiplication 
function IntMultiplication(result) {
	this.init(function(x,y) {return (x*y);}, result, MathFunction.tailArgs(arguments,1));
}
IntMultiplication.prototype = new MathFunction();
IntMultiplication.prototype.constructor = Multiplication;
IntMultiplication.prototype.roundPlaces = 0;
IntMultiplication.prototype.totalFunc = Math.floor;

// Division 
function Division(result) {
	this.init(function(x,y) {return (x/y);}, result, MathFunction.tailArgs(arguments,1));
}
Division.prototype = new MathFunction();
Division.prototype.constructor = Division;

// IntDivision 
function IntDivision(result) {
	this.init(function(x,y) {return (x/y);}, result, MathFunction.tailArgs(arguments,1));
}
IntDivision.prototype = new MathFunction();
IntDivision.prototype.constructor = Division;
IntDivision.prototype.roundPlaces = 0;
IntDivision.prototype.totalFunc = Math.floor;

// Percentage
function Percentage(result) {
	this.init(function(x,y) {return (x/y*100);}, result, MathFunction.tailArgs(arguments,1));
}
Percentage.prototype = new MathFunction();
Percentage.prototype.constructor = Percentage;

// Copy
function Copy(result) {
	this.init(function(x,y) {return (y);}, result, MathFunction.tailArgs(arguments,1));
}
Copy.prototype = new MathFunction();
Copy.prototype.constructor = Copy;
Copy.prototype.roundPlaces = 0;

// CurrencySummation 
function CurrencySummation(result) {
	this.init(function(x,y) {return (Math.floor(x)+Math.floor(y))}, result, MathFunction.tailArgs(arguments,1));
}
CurrencySummation.prototype = new MathFunction();
CurrencySummation.prototype.constructor = CurrencySummation;
CurrencySummation.prototype.roundPlaces = 2;
CurrencySummation.prototype.totalFunc = Math.floor;
CurrencySummation.prototype.format = function (x) {
	// Add commas before period
	var s = Math.round(x * Math.pow(10, this.roundPlaces)).toString();
		
	var ret = '';
	
	if (this.roundPlaces > 0) {
	    ret = '.' + s.slice(-this.roundPlaces);
	    s = s.slice(0, -this.roundPlaces);
	}
	
	while (s.length > 3) {
	    ret = ',' + s.slice(-3) + ret;
	    s = s.slice(0, -3);
	}
		
	ret = s + ret;
		
	return '$' + ret;
};
