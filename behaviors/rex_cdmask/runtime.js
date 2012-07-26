﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.Rex_cdmask = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.Rex_cdmask.prototype;
		
	/////////////////////////////////////
	// Behavior type class
	behaviorProto.Type = function(behavior, objtype)
	{
		this.behavior = behavior;
		this.objtype = objtype;
		this.runtime = behavior.runtime;
	};
	
	var behtypeProto = behaviorProto.Type.prototype;

	behtypeProto.onCreate = function()
	{ 
        this.canvas_type = null;   	    
	};

	/////////////////////////////////////
	// Behavior instance class
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;
		this.runtime = type.runtime;
	};
	
	var behinstProto = behaviorProto.Instance.prototype;
    
	behinstProto.onCreate = function()
	{        
	    this.mask_color = this.properties[0];
	    this.is_circle = (this.properties[1] == 1);
	    this.canvas_inst = null;
        this._inst_info = {};
	};  
    
	behinstProto.onDestroy = function()
	{
        if (this.canvas_inst != null)
        {
            this.runtime.DestroyInstance(this.canvas_inst);
            this.canvas_inst = null;
        }
	};  
    
	behinstProto.tick = function ()
	{
        this._bind_canvas_to_inst();
	};
	
	behinstProto._create_canvas = function ()
	{
	    if (this.canvas_inst != null)
	        return;
	        
	    var canvas_type = this.type.canvas_type;
        assert2(canvas_type, "[CD mask] you need pass a canvas object.");   
	    var _layer = this.runtime.getLayerByNumber(this.inst.layer.index);
	    var _x = this.inst.x;
	    var _y = this.inst.y;	         
        this.canvas_inst = this.runtime.createInstance(canvas_type,_layer,_x,_y);
        this._bind_canvas_to_inst();
        this.canvas_inst.hotspotX = this.inst.hotspotX;
        this.canvas_inst.hotspotY = this.inst.hotspotY;
        this.canvas_inst.ctx.clearRect(0,0,this.canvas_inst.width,this.canvas_inst.height);
	};
       
	behinstProto._bind_canvas_to_inst = function ()
	{
        if (this.canvas_inst == null)
            return;
            
        var reflash = false;     
        if (this._inst_info.x != this.inst.x)
        {
            this.canvas_inst.x = this.inst.x;
            this._inst_info.x = this.inst.x;
            reflash = true;
        }
        if (this._inst_info.y != this.inst.y)
        {
            this.canvas_inst.y = this.inst.y;
            this._inst_info.y = this.inst.y;
            reflash = true;
        }     
        if (this._inst_info.angle != this.inst.angle)
        {
            this.canvas_inst.angle = this.inst.angle;
            this._inst_info.angle = this.inst.angle;
            reflash = true;
        }  
        if (this._inst_info.width != this.inst.width)
        {
            this.canvas_inst.width = this.inst.width;
            this._inst_info.width = this.inst.width;
            reflash = true;
        }
        if (this._inst_info.height != this.inst.height)
        {
            this.canvas_inst.height = this.inst.height;
            this._inst_info.height = this.inst.height;
            reflash = true;
        } 
        if (reflash)
            this.canvas_inst.runtime.redraw = true; 
	};
    
    var start_radians = cr.to_radians(-90);
	behinstProto._cd_mask = function (percentage)
	{
	    this._create_canvas();    
	    if (percentage > 1)
	        percentage = 1;	      
	    var inst = this.canvas_inst;
	    var ctx = inst.ctx;
	    var width = inst.canvas.width;
	    var height = inst.canvas.height;
	    ctx.clearRect(0,0,width,height);
	    
	    var center_x = width/2;
	    var center_y = height/2; 
	    var radius;
	    if (this.is_circle)
	        radius = Math.min(center_x, center_y);
	    else
	        radius = Math.max(width, height) *2 ;	    
	    if (percentage == 1)
	    {
	        ctx.fillStyle = this.mask_color;
	        if (this.is_circle)
	        {
		        ctx.beginPath();
		        ctx.arc(center_x, center_y, radius, 0, cr.to_radians(360), true);
		        ctx.fill();          
	        }
	        else 	       
	            ctx.fillRect(0,0,width,height);
	    }	   
	    else if (percentage > 0)
	    {
	        var end_angle = (360*(1-percentage)) -90;
	        ctx.beginPath();
	        ctx.moveTo(center_x, center_y);
	        ctx.lineTo(center_x, center_y - radius);
	        ctx.arc(center_x, center_y, radius, 
	                start_radians, cr.to_radians(end_angle), 
	                true);
		    ctx.fillStyle = this.mask_color;
		    ctx.fill();
	    }
	    
	    inst.runtime.redraw = true;    
	};	
	
	behinstProto._pick_canvas_inst = function ()
	{
        this._create_canvas();
        var canvas_type = this.type.canvas_type;
        var sol = canvas_type.getCurrentSol();  
        sol.instances.push(this.canvas_inst);   
        sol.select_all = false; 
	};
	//////////////////////////////////////
	// Conditions
	function Cnds() {};
	behaviorProto.cnds = new Cnds();
	  
	Cnds.prototype.PickCanvas = function ()
	{
        this._pick_canvas_inst(); 
		return true;
	};	 
	//////////////////////////////////////
	// Actions
	function Acts() {};
	behaviorProto.acts = new Acts();

    Acts.prototype.SetupCanvas = function (canvas_type)
	{
	    this.type.canvas_type = canvas_type;   
	}; 

	Acts.prototype.SetCoolDownPercentage = function(percentage)
	{
	    this._cd_mask(percentage);
	};

	Acts.prototype.SetMaskColor = function(color)
	{
	    this.mask_color = color;
	};  

	Acts.prototype.PickCanvas = function()
	{
        this._pick_canvas_inst();      
	};    
    
    
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	behaviorProto.exps = new Exps();

}());