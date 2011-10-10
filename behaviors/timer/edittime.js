﻿function GetBehaviorSettings()
{
	return {
		"name":			"Timer",
		"id":			"MyTimer",
		"description":	"Timer",
		"author":		"Rex.Rainbow",
		"help url":		"",
		"category":		"Varaible",
		"flags":		0
	};
};

//////////////////////////////////////////////////////////////
// Conditions
AddAnyTypeParam("Name", "Timer's name", '""');
AddCondition(0, 0, "Is timmer running", "Timer", "Is running", "", "IsRunning");

//////////////////////////////////////////////////////////////
// Actions
AddObjectParam("Timeline", "Timeline object for getting timer");
AddObjectParam("Function", "Function object for callback");
AddAction(0, 0, "Setup timer", "Setup", 
          "Get timer {my} from <i>{0}</i>, callback to <i>{1}</i>", 
          "Setup timer.", "Setup");
AddStringParam("CB", "Function name of timer's callback", '""');
//AddStringParam("Param", "Function parameters, in JSON format", '""');
AddAction(1, 0, "Create timer", "Timer", 
          "Create timer {my} with callback <i>{0}</i>", 
          "Create timer.", "Create");    
AddNumberParam("Time", "Time-out in seconds", 0);
AddAction(2, 0, "Start timer", "Timer", 
          "Start timer {my}, time-out is <i>{0}</i> seconds", 
          "Start timer.", "Start");   
AddAction(3, 0, "Pause timer", "Timer", 
          "Pause timer {my}", 
          "Pause timer.", "Pause"); 
AddAction(4, 0, "Resume timer", "Timer", 
          "Resume timer {my}", 
          "Resume timer.", "Resume");               
AddAction(5, 0, "Stop timer", "Timer", 
          "Stop timer {my}", 
          "Stop timer.", "Stop");          

//////////////////////////////////////////////////////////////
// Expressions
AddExpression(0, ef_return_number, "Get remainder time", 
              "Timer", "Remainder", 
              "Get remainder time.");
AddExpression(1, ef_return_number, "Get elapsed time of timer", 
              "Timer", "TimerElapsed", 
              "Get elapsed time of timer.");              



ACESDone();

// Property grid properties for this plugin
var property_list = [
	];
	
// Called by IDE when a new behavior type is to be created
function CreateIDEBehaviorType()
{
	return new IDEBehaviorType();
}

// Class representing a behavior type in the IDE
function IDEBehaviorType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new behavior instance of this type is to be created
IDEBehaviorType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance, this);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
	
	// Save the constructor parameters
	this.instance = instance;
	this.type = type;
	
	// Set the default property values from the property table
	this.properties = {};
	
	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
}

// Called by the IDE after all initialization on this instance has been completed
IDEInstance.prototype.OnCreate = function()
{
}

// Called by the IDE after a property has been changed
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
}