﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

// load socket.io.min.js
document.write('<script src="zlib_and_gzip.min.js"></script>');

/////////////////////////////////////
// Plugin class
cr.plugins_.Rex_JSONTMXImporter = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var pluginProto = cr.plugins_.Rex_JSONTMXImporter.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};
	
	var typeProto = pluginProto.Type.prototype;

	typeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	instanceProto.onCreate = function()
	{
        // tiles
        this.exp_MapWidth = 0;
        this.exp_MapHeight = 0;  
        this.exp_TileWidth = 0;
        this.exp_TileHeight = 0;
        this.exp_TotalWidth = 0;
        this.exp_TotalHeight = 0; 
        this.exp_IsIsometric = 0;         
        this.exp_TileID = (-1);
		this.exp_TilesetName = "";
        this.exp_LogicX = (-1);
        this.exp_LogicY = (-1);  
        this.exp_PhysicalX = (-1);
        this.exp_PhysicalY = (-1);        
        this.exp_InstUID = (-1);
        this.exp_Frame = (-1);        
        this.exp_IsMirrored = 0;
        this.exp_IsFlipped = 0;
        this.exp_TileAngle = 0;
        this.exp_LayerName = "";  
        this.exp_LayerOpacity = 1;  
        this.exp_MapProperties = null;                
        this.exp_LayerProperties = null;
        this.exp_TilesetProperties = null;        
        this.exp_TileProperties = null;
        this.exp_BaclgroundColor = 0;        
        
        // objects
		this.exp_ObjGroupName = "";        
        this.exp_ObjGroupWidth = 0;
        this.exp_ObjGroupHeight = 0;  
		this.exp_ObjectName = "";  
		this.exp_ObjectType = "";         
        this.exp_ObjectWidth = 0;
        this.exp_ObjectHeight = 0; 
        this.exp_ObjectLX = 0;
        this.exp_ObjectLY = 0; 
        this.exp_ObjectPX = 0;
        this.exp_ObjectPY = 0;         
        this.exp_ObjectProperties = {};

        // for each property
        this.exp_CurLayerPropName = "";
        this.exp_CurLayerPropValue ="";
        this.exp_CurTilesetPropName = "";
        this.exp_CurTilesetPropValue ="";        
        this.exp_CurTilePropName = "";
        this.exp_CurTilePropValue ="";     
        this.exp_CurMapPropName = "";
        this.exp_CurMapPropValue ="";        
        
        // duration
        this.exp_RetrievingPercent = 0;      
        
        
        this._tmx_obj = null;  
        this._obj_type = null;
        this.layout = new cr.plugins_.Rex_JSONTMXImporter.LayoutKlass(this, this.properties[0], this.properties[1],
                                                                  0,0,0);
        this._created_inst = null;
        
        // duration
        this._duration_reset();     
	};
	instanceProto.ImportTMX = function(JSON_string)
	{
        var isIE = this.runtime.isIE;
        this._tmx_obj = new cr.plugins_.Rex_JSONTMXImporter.TMXKlass(JSON_string, isIE);
        this.exp_MapWidth = this._tmx_obj.map.width;
        this.exp_MapHeight = this._tmx_obj.map.height;  
        this.exp_TileWidth = this._tmx_obj.map.tilewidth; 
        this.exp_TileHeight = this._tmx_obj.map.tileheight; 
        this.exp_IsIsometric = (this._tmx_obj.map.orientation == "isometric");
        this.exp_TotalWidth = (this.exp_IsIsometric)? ((this.exp_MapWidth+this.exp_MapHeight)/2)*this.exp_TileWidth: 
                                                      this.exp_MapWidth*this.exp_TileWidth;
        this.exp_TotalHeight = (this.exp_IsIsometric)? ((this.exp_MapWidth+this.exp_MapHeight)/2)*this.exp_TileHeight: 
                                                       this.exp_MapHeight*this.exp_TileHeight;
        this.exp_BaclgroundColor = this._tmx_obj.map.backgroundcolor;                                                       
        this.exp_MapProperties = this._tmx_obj.map.properties;
	};
	instanceProto.RetrieveTileArray = function(obj_type)
	{
        this._layout_set(this._tmx_obj);
        var layers = this._tmx_obj.layers;
        var layers_cnt = layers.length;
        this._obj_type = obj_type;
        var i;
        // tiles
        for(i=0; i<layers_cnt; i++)
           this._create_layer_objects(layers[i], i); 
        // objects
        this._retrieve_objects();
        this.runtime.trigger(cr.plugins_.Rex_JSONTMXImporter.prototype.cnds.OnRetrieveFinished, this);
	};
	instanceProto._layout_set = function(tmx_obj)
	{
        this.layout.is_isometric = this.exp_IsIsometric;
        this.layout.SetWidth(this.exp_TileWidth);
        this.layout.SetHeight(this.exp_TileHeight);
	};	
	// bitmaks to check for flipped & rotated tiles
	var FlippedHorizontallyFlag		= 0x80000000;
	var FlippedVerticallyFlag		= 0x40000000;
	var FlippedAntiDiagonallyFlag   = 0x20000000;   
	instanceProto._create_layer_objects = function(tmx_layer, layer_index)
	{
        var c2_layer =  this._get_layer(tmx_layer.name);
        if ((c2_layer == null) && (this._obj_type != null))
            alert('TMX Importer: Can not find "' + tmx_layer.name + '" layer');
        if ((this._obj_type != null) && (c2_layer != null) && (layer_index == 0) && (this.exp_BaclgroundColor != null))
        {
            cr.system_object.prototype.acts.SetLayerBackground.call(this, c2_layer, this.exp_BaclgroundColor);
            //cr.system_object.prototype.acts.SetLayerTransparent.call(this, c2_layer, 0);            
        }
            
        var width = tmx_layer.width;
        var height = tmx_layer.height;
        var data = tmx_layer.data;
        var x,y,inst,tileset_obj,tile_obj,layer_opacity,_gid, tile_rotateID; 
        var i=0;
        
        this.exp_LayerName = tmx_layer.name;        
        this.exp_LayerProperties = tmx_layer.properties;
        this.exp_LayerOpacity = tmx_layer.opacity;
        for (y=0; y<height; y++)
        {
            for (x=0; x<width; x++)
            {     
                // get tile id
                _gid = data[i];
                i++;
                if (_gid == 0)
                    continue;
                
                // prepare expressions
                this.exp_TileID = _gid & ~(FlippedHorizontallyFlag | FlippedVerticallyFlag | FlippedAntiDiagonallyFlag);  
                this.exp_LogicX = x;
                this.exp_LogicY = y;
                this.exp_PhysicalX = this.layout.LXYZ2PX(x,y);
                this.exp_PhysicalY = this.layout.LXYZ2PY(x,y);
                this.exp_IsMirrored = ((_gid & FlippedHorizontallyFlag) !=0)? 1:0;
                this.exp_IsFlipped = ((_gid & FlippedVerticallyFlag) !=0)? 1:0;
                tile_rotateID = (_gid >> 29) & 0x7;
                this.exp_TileAngle = (tile_rotateID == 5)? 90:
                                     (tile_rotateID == 6)? 180:
                                     (tile_rotateID == 3)? 270: 0;
                tileset_obj = this._tmx_obj.GetTileSet(this.exp_TileID);
				this.exp_TilesetName = tileset_obj.name;
                this.exp_TilesetProperties = tileset_obj.properties;
                tile_obj = tileset_obj.tiles[this.exp_TileID];
                this.exp_Frame = this.exp_TileID - tileset_obj.firstgid;
                this.exp_TileProperties = (tile_obj != null)? tile_obj.properties: null;
                   
                if (this._obj_type != null)
                    this._created_inst = this._create_instance(x,y,c2_layer); 
                else
                    this._created_inst = null;
                    
                // trigger callback
                this.runtime.trigger(cr.plugins_.Rex_JSONTMXImporter.prototype.cnds.OnEachTileCell, this); 
            }
        }         
	};
	instanceProto._create_instance = function(x,y,c2_layer)
	{  
        var inst = this.layout.CreateItem(this._obj_type,x,y,c2_layer);
        cr.plugins_.Sprite.prototype.acts.SetAnimFrame.call(inst, this.exp_Frame);
        inst.opacity = this.exp_LayerOpacity;          
        inst.angle = cr.to_clamped_radians(this.exp_TileAngle);
        if ((this.exp_TileAngle == 0) && (this.exp_IsMirrored ==1))
            inst.width = -inst.width;
        if ((this.exp_TileAngle == 0) && (this.exp_IsFlipped ==1))
            inst.height = -inst.height;           
        
        this.exp_InstUID = inst.uid; 
        return inst        
    };
    instanceProto._get_layer = function(layerparam)
    {
        return (typeof layerparam == "number")?
               this.runtime.getLayerByNumber(layerparam):
               this.runtime.getLayerByName(layerparam);
    };       
    instanceProto._retrieve_objects = function()
    {
        var obj_groups = this._tmx_obj.objectgroups;
        var i, group, group_cnt=obj_groups.length;
        var j, obj, objs, obj_cnt;
        var x,y;
        for (i=0; i<group_cnt; i++)
        {
            group = obj_groups[i];
            this.exp_ObjGroupName = group.name;
            this.exp_ObjGroupWidth = group.width;
            this.exp_ObjGroupHeight = group.height;            
            objs = group.objects;
            obj_cnt = objs.length;
            for (j=0; j<obj_cnt; j++)
            {
                obj = objs[j];
                this.exp_ObjectName = obj.name;
                this.exp_ObjectType = obj.type;
                this.exp_ObjectWidth = obj.width / this.exp_TileWidth;
                this.exp_ObjectHeight = obj.height / this.exp_TileHeight;
                x = obj.x / this.exp_TileWidth;
                y = obj.y / this.exp_TileHeight;
                this.exp_ObjectLX = x;
                this.exp_ObjectLY = y;                
                this.exp_ObjectPX = this.layout.LXYZ2PX(x,y);
                this.exp_ObjectPY = this.layout.LXYZ2PY(x,y);                
                this.exp_ObjectProperties = obj.properties;
                this.runtime.trigger(cr.plugins_.Rex_JSONTMXImporter.prototype.cnds.OnEachObject, this); 
            }
        }
    };
    
    // duration mode
    instanceProto._duration_start = function(tile_objtype)
    {
        this._duration_reset();       
        this._duration_info.total_objects_count = _get_tiles_cnt(this._tmx_obj) + _get_objects_cnt(this._tmx_obj);
        this._layout_set(this._tmx_obj);
        this._obj_type = tile_objtype;        
        this.runtime.tickMe(this);
        this.tick();
    }; 
    instanceProto._duration_reset = function()
    {
        this._duration_info = {working_time:(1/60)*1000*0.5,
                               state:0, // 0=idle, 1=retrieve tile layer, 2=retrieve object layer
                               goto_next_state:false,
                               total_objects_count:0,
                               current_objects_count:0,
                               tile_layer:{layer_index:0,data_index:0},
                               object_layer:{group_index:0,object_index:0},
                               };
    }; 
    instanceProto.tick = function()
    {        
        var process_percent;
        var start_time = Date.now();
        var working_time = this._duration_info.working_time;
        // fix working_time
        while ((Date.now() - start_time) <= working_time)
        {
            this.exp_RetrievingPercent = this._retrieve_one_tile_prepare();
            this._retrieve_one_tile_callevent();
            if (this.exp_RetrievingPercent == 1)
                break;
            else if (this._duration_info.goto_next_state)
            {
                this._duration_info.state += 1;                
                this._duration_info.goto_next_state = false;
            }
        }
		this.runtime.trigger(cr.plugins_.Rex_JSONTMXImporter.prototype.cnds.OnRetrieveDurationTick, this); 
		if (this.exp_RetrievingPercent == 1)
		    this._duration_finished();   
    };    
    instanceProto._duration_finished = function()
    {
        this._duration_info.state = 0;
        this.runtime.untickMe(this);
        this.runtime.trigger(cr.plugins_.Rex_JSONTMXImporter.prototype.cnds.OnRetrieveFinished, this);
    };
    
    var _get_tiles_cnt = function(tmx_obj)
    {
        var layers = tmx_obj.layers;
        var i, layers_cnt = layers.length;
        var tile_cnt, total_tiles_cnt=0;
        for(i=0; i<layers_cnt; i++)
           total_tiles_cnt += layers[i].data.length;
        return total_tiles_cnt;
    };     
    var _get_objects_cnt = function(tmx_obj)
    {
        var obj_groups = tmx_obj.objectgroups;
        var i, group_cnt=obj_groups.length;
        var obj_cnt, total_objects_cnt=0;
        for (i=0; i<group_cnt; i++)        
            total_objects_cnt += obj_groups[i].objects.length; 
        return total_objects_cnt;
    };          
    instanceProto._retrieve_one_tile_prepare = function()
    {
        var unit_cnt;
        if (this._duration_info.state == 1)
            unit_cnt = this._retrieve_one_tile();
        else
            unit_cnt = this._retrieve_one_object(); 
            
        this._duration_info.current_objects_count += unit_cnt;
        return (this._duration_info.current_objects_count/this._duration_info.total_objects_count);   
    };
    
    instanceProto._retrieve_one_tile = function()
    {   
        var unit_cnt=0;
        var layer_index,data_index,layers,layer,c2_layer,_gid,x,y,tile_rotateID;
        var tileset_obj,tile_obj;
        var is_valid = false;
        while (!is_valid)
        {
            layer_index = this._duration_info.tile_layer.layer_index;
            data_index = this._duration_info.tile_layer.data_index;

            layers = this._tmx_obj.layers;
            if (layers.length == 0)
            {
                this._duration_info.goto_next_state = true;  // tile layer retrieve finished
                return 0;
            }
            
            layer = layers[layer_index];
            c2_layer =  this._get_layer(layer.name);
            if ((c2_layer == null) && (this._obj_type != null))
                alert('TMX Importer: Can not find "' + tmx_layer.name + '" layer'); 
            if ((this._obj_type != null) && (c2_layer != null) && (layer_index == 0) && (data_index == 0) && (this.exp_BaclgroundColor != null))
            {
                cr.system_object.prototype.acts.SetLayerBackground.call(this, c2_layer, this.exp_BaclgroundColor);
                //cr.system_object.prototype.acts.SetLayerTransparent.call(this, c2_layer, 0);            
            }                
            // get tile id
            unit_cnt += 1;
            _gid = layer.data[data_index];            
            is_valid = (_gid != 0);
            if (is_valid)  
            {         
                this.exp_LayerName = layer.name;        
                this.exp_LayerProperties = layer.properties;
                this.exp_LayerOpacity = layer.opacity;            
                this.exp_TileID = _gid & ~(FlippedHorizontallyFlag | FlippedVerticallyFlag | FlippedAntiDiagonallyFlag);       
                // prepare expressions
                x = data_index%layer.width;
                y = (data_index-x)/layer.height;
                this.exp_LogicX = x;
                this.exp_LogicY = y;
                this.exp_PhysicalX = this.layout.LXYZ2PX(x,y);
                this.exp_PhysicalY = this.layout.LXYZ2PY(x,y);
                this.exp_IsMirrored = ((_gid & FlippedHorizontallyFlag) !=0)? 1:0;
                this.exp_IsFlipped = ((_gid & FlippedVerticallyFlag) !=0)? 1:0;
                tile_rotateID = (_gid >> 29) & 0x7;
                this.exp_TileAngle = (tile_rotateID == 5)? 90:
                                     (tile_rotateID == 6)? 180:
                                     (tile_rotateID == 3)? 270: 0;                
                tileset_obj = this._tmx_obj.GetTileSet(this.exp_TileID);
		        this.exp_TilesetName = tileset_obj.name;
                this.exp_TilesetProperties = tileset_obj.properties;
                tile_obj = tileset_obj.tiles[this.exp_TileID];
                this.exp_Frame = this.exp_TileID - tileset_obj.firstgid;
                this.exp_TileProperties = (tile_obj != null)? tile_obj.properties: null;
                   
                if (this._obj_type != null)
                    this._created_inst = this._create_instance(x,y,c2_layer); 
                else
                    this._created_inst = null;   
            }     
            
            // update index
            if (data_index == (layer.data.length-1))  // the last data index
            {
                if (layer_index != (layers.length-1))  // not the last layer
                {
                    this._duration_info.tile_layer.layer_index += 1;
                    this._duration_info.tile_layer.data_index = 0;  // start from 0                    
                }
                else
                {
                    this._duration_info.goto_next_state = true;  // tile layer retrieve finished
                    break;
                }
            }
            else
                this._duration_info.tile_layer.data_index += 1;    
        }   
        return unit_cnt;
    }; 
    
    instanceProto._retrieve_one_object = function()
    {
        var group_index = this._duration_info.object_layer.group_index;
        var object_index = this._duration_info.object_layer.object_index;
        
        var objectgroups = this._tmx_obj.objectgroups;
        if (objectgroups.length == 0)
        {
            this._duration_info.goto_next_state = true;
            return 0;
        }
        var group = objectgroups[group_index];
        this.exp_ObjGroupName = group.name;
        this.exp_ObjGroupWidth = group.width;
        this.exp_ObjGroupHeight = group.height; 
        var obj = group.objects[object_index];
        this.exp_ObjectName = obj.name;
        this.exp_ObjectType = obj.type;
        this.exp_ObjectWidth = obj.width / this.exp_TileWidth;
        this.exp_ObjectHeight = obj.height / this.exp_TileHeight;
        var x = obj.x / this.exp_TileWidth;
        var y = obj.y / this.exp_TileHeight;
        this.exp_ObjectLX = x;
        this.exp_ObjectLY = y;                
        this.exp_ObjectPX = this.layout.LXYZ2PX(x,y);
        this.exp_ObjectPY = this.layout.LXYZ2PY(x,y);                
        this.exp_ObjectProperties = obj.properties;
        
        // update index
        if (object_index == (group.objects.length-1))  // the last object index
        {
            if (group_index != objectgroups.length-1)  // not the last object group
            {
                this._duration_info.object_layer.group_index += 1;
                this._duration_info.object_layer.object_index = 0;  // start from 0
            }
            else
            {
                this._duration_info.goto_next_state = true;  // objects layer retrieve finished
            }
        }
        else
            this._duration_info.object_layer.object_index += 1;
            
        return 1;
    };    
    instanceProto._retrieve_one_tile_callevent = function()
    {
        if (this._duration_info.state == 1)
            this.runtime.trigger(cr.plugins_.Rex_JSONTMXImporter.prototype.cnds.OnEachTileCell, this); 
        else
            this.runtime.trigger(cr.plugins_.Rex_JSONTMXImporter.prototype.cnds.OnEachObject, this); 
    };  
	
	//////////////////////////////////////
	// Conditions
	function Cnds() {};
	pluginProto.cnds = new Cnds();    
	  
	Cnds.prototype.OnEachTileCell = function ()
	{
        var inst = this._created_inst;
        if (inst != null)
        {
            var sol = inst.type.getCurrentSol();
            sol.select_all = false;
		    sol.instances.length = 1;
		    sol.instances[0] = inst;
		
		    // Siblings aren't in instance lists yet, pick them manually
		    var i, len, s;
		    if (inst.is_contained)
		    {
			    for (i = 0, len = inst.siblings.length; i < len; i++)
			    {
				    s = inst.siblings[i];
				    sol = s.type.getCurrentSol();
				    sol.select_all = false;
				    sol.instances.length = 1;
				    sol.instances[0] = s;
			    }
		    }
        
		    this.runtime.isInOnDestroy++;
		    this.runtime.trigger(Object.getPrototypeOf(inst.type.plugin).cnds.OnCreated, inst);
		    this.runtime.isInOnDestroy--;
        }
		return true;
	};	
	Cnds.prototype.OnEachObject = function ()
	{
		return true;
	};    
    
    // for each property
	Cnds.prototype.ForEachLayerProperty = function ()
	{   
        if (this.exp_LayerProperties == null)
            return false;
            
        var current_event = this.runtime.getCurrentEventStack().current_event;	
        var key, props = this.exp_LayerProperties, value;
		for (key in props)
	    {
            this.exp_CurLayerPropName = key;
            this.exp_CurLayerPropValue = props[key];
		    this.runtime.pushCopySol(current_event.solModifiers);
			current_event.retrigger();
			this.runtime.popSol(current_event.solModifiers);
		}

		this.exp_CurLayerPropName = "";
        this.exp_CurLayerPropValue = "";
		return false;        
	};   
	Cnds.prototype.ForEachTilesetProperty = function ()
	{
        if (this.exp_TilesetProperties == null)
            return false;
            
        var current_event = this.runtime.getCurrentEventStack().current_event;		
        var key, props = this.exp_TilesetProperties, value;
		for (key in props)
	    {
            this.exp_CurTilesetPropName = key;
            this.exp_CurTilesetPropValue = props[key];
		    this.runtime.pushCopySol(current_event.solModifiers);
			current_event.retrigger();
			this.runtime.popSol(current_event.solModifiers);
		}

		this.exp_CurTilesetPropName = "";
        this.exp_CurTilesetPropValue = "";
		return false;        
	};   
	Cnds.prototype.ForEachTileProperty = function ()
	{   
        if (this.exp_TileProperties == null)
            return false;
            
        var current_event = this.runtime.getCurrentEventStack().current_event;		
        var key, props = this.exp_TileProperties, value;
		for (key in props)
	    {
            this.exp_CurTilePropName = key;
            this.exp_CurTilePropValue = props[key];
		    this.runtime.pushCopySol(current_event.solModifiers);
			current_event.retrigger();
			this.runtime.popSol(current_event.solModifiers);
		}

		this.exp_CurTilePropName = "";
        this.exp_CurTilePropValue = "";
		return false;        
	};
	Cnds.prototype.ForEachMapProperty = function ()
	{   
        if (this.exp_MapProperties == null)
            return false;
            
        var current_event = this.runtime.getCurrentEventStack().current_event;		
        var key, props = this.exp_MapProperties, value;
		for (key in props)
	    {
            this.exp_CurMapPropName = key;
            this.exp_CurMapPropValue = props[key];
		    this.runtime.pushCopySol(current_event.solModifiers);
			current_event.retrigger();
			this.runtime.popSol(current_event.solModifiers);
		}

		this.exp_CurMapPropName = "";
        this.exp_CurMapPropValue = "";
		return false;        
	};	      
    
    // duration
	Cnds.prototype.OnRetrieveFinished = function ()
	{
		return true;
	};
	Cnds.prototype.OnRetrieveDurationTick = function ()
	{
		return true;
	};    
	//////////////////////////////////////
	// Actions
	function Acts() {};
	pluginProto.acts = new Acts();
	
    Acts.prototype.ImportTMX = function (JSON_string)
	{	     
        this.ImportTMX(JSON_string);
	};
    Acts.prototype.CreateTiles = function (obj_type)
	{	     
        this.RetrieveTileArray(obj_type);
	};
    Acts.prototype.ReleaseTMX = function ()
	{	     
        this._tmx_obj = null;    
	};	
    Acts.prototype.SetOPosition = function (x,y)
	{	     
        this.layout.PositionOX = x;
        this.layout.PositionOY = y;        
	};
    Acts.prototype.RetrieveTileArray = function ()
	{	  
        this.RetrieveTileArray();
	}; 
    Acts.prototype.CreateTilesDuration = function (obj_type)
	{
	    this._duration_start(obj_type);
	};    
    Acts.prototype.RetrieveTileArrayDuration = function ()
	{
	    this._duration_start();	    
	};     
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	pluginProto.exps = new Exps();
    
    // tiles
	Exps.prototype.MapWidth = function (ret)
	{   
	    ret.set_int(this.exp_MapWidth);
	};
	Exps.prototype.MapHeight = function (ret)
	{   
	    ret.set_int(this.exp_MapHeight);
	};
	Exps.prototype.TileWidth = function (ret)
	{     
	    ret.set_int(this.exp_TileWidth);
	};
	Exps.prototype.TileHeight = function (ret)
	{    
	    ret.set_int(this.exp_TileHeight);
	}; 	
	Exps.prototype.TotalWidth = function (ret)
	{     
	    ret.set_int(this.exp_TotalWidth);
	};
	Exps.prototype.TotalHeight = function (ret)
	{    
	    ret.set_int(this.exp_TotalHeight);
	}; 	
	Exps.prototype.IsIsometric = function (ret)
	{    
	    ret.set_int(this.exp_IsIsometric? 1:0);
	}; 		
	Exps.prototype.TileID = function (ret)
	{    
	    ret.set_int(this.exp_TileID);
	}; 
	Exps.prototype.LogicX = function (ret)
	{   
	    ret.set_int(this.exp_LogicX);
	};
	Exps.prototype.LogicY = function (ret)
	{   
	    ret.set_int(this.exp_LogicY);
	};    
	Exps.prototype.LayerProp = function (ret, name, default_value)
	{   
        var value;
        if (this.exp_LayerProperties == null)
            value = default_value;
        else
        {
            value = this.exp_LayerProperties[name];
            if (value == null)
                value = default_value;
        }
	    ret.set_any(value);
	};
	Exps.prototype.TilesetProp = function (ret, name, default_value)
	{       
        var value;
        if (this.exp_TilesetProperties == null)
            value = default_value;
        else
        {
            value = this.exp_TilesetProperties[name];
            if (value == null)
                value = default_value;        
        }
	    ret.set_any(value);
	};     
	Exps.prototype.TileProp = function (ret, name, default_value)
	{    
        var value    
        if (this.exp_TileProperties == null)
            value = default_value;
        else
        {
            value = this.exp_TileProperties[name];
            if (value == null)
                value = default_value;        
        }
	    ret.set_any(value);
	}; 
	Exps.prototype.PhysicalX = function (ret)
	{   
	    ret.set_int(this.exp_PhysicalX);
	};
	Exps.prototype.PhysicalY = function (ret)
	{   
	    ret.set_int(this.exp_PhysicalY);
	};
	Exps.prototype.LayerName = function (ret)
	{   
	    ret.set_string(this.exp_LayerName);
	};
	Exps.prototype.LayerOpacity = function (ret)
	{   
	    ret.set_float(this.exp_LayerOpacity);
	}; 
	Exps.prototype.IsMirrored = function (ret)
	{   
	    ret.set_int(this.exp_IsMirrored);
	};
	Exps.prototype.IsFlipped = function (ret)
	{   
	    ret.set_int(this.exp_IsFlipped);
	}; 
	Exps.prototype.InstUID = function (ret)
	{   
	    ret.set_int(this.exp_IsFlipped);
	}; 
	Exps.prototype.Frame = function (ret)
	{   
	    ret.set_int(this.exp_Frame);
	};  
	Exps.prototype.TilesetName = function (ret)
	{     
	    ret.set_string(this.exp_TilesetName);
	};
	Exps.prototype.MapProp = function (ret, name, default_value)
	{   
        var value;
        if (this.exp_MapProperties == null)
            value = default_value;
        else
        {
            value = this.exp_MapProperties[name];
            if (value == null)
                value = default_value;
        }
	    ret.set_any(value);
	};	
	Exps.prototype.TileAngle = function (ret)
	{     
	    ret.set_float(this.exp_TileAngle);
	};    
	Exps.prototype.BackgroundColor = function (ret)
	{     
	    var val = this.exp_BaclgroundColor;
	    if (val == null)
	        val = 0;
	    ret.set_int(val);
	}; 
	
    // objects
	Exps.prototype.ObjGroupName = function (ret)
	{     
	    ret.set_string(this.exp_ObjGroupName);
	};    
	Exps.prototype.ObjGroupWidth = function (ret)
	{     
	    ret.set_string(this.exp_ObjGroupWidth);
	};
	Exps.prototype.ObjGroupHeight = function (ret)
	{     
	    ret.set_string(this.exp_ObjGroupHeight);
	};  
	Exps.prototype.ObjectName = function (ret)
	{     
	    ret.set_string(this.exp_ObjectName);
	};  
	Exps.prototype.ObjectType = function (ret)
	{     
	    ret.set_string(this.exp_ObjectType);
	};     
	Exps.prototype.ObjectWidth = function (ret)
	{     
	    ret.set_int(this.exp_ObjectWidth);
	};
	Exps.prototype.ObjectHeight = function (ret)
	{     
	    ret.set_int(this.exp_ObjectHeight);
	};
	Exps.prototype.ObjectX = function (ret)
	{     
	    ret.set_int(this.exp_ObjectLX);
	};
	Exps.prototype.ObjectY = function (ret)
	{     
	    ret.set_int(this.exp_ObjectLY);
	};
	Exps.prototype.ObjectPX = function (ret)
	{     
	    ret.set_int(this.exp_ObjectPX);
	};
	Exps.prototype.ObjectPY = function (ret)
	{     
	    ret.set_int(this.exp_ObjectPY);
	};	
	Exps.prototype.ObjectProp = function (ret, name, default_value)
	{   
        var value;
        if (this.exp_ObjectProperties == null)
            value = default_value;
        else
        {
            value = this.exp_ObjectProperties[name];
            if (value == null)
                value = default_value;
        }
	    ret.set_any(value);
	}; 
    
    // for each property
	Exps.prototype.CurLayerPropName = function (ret)
	{
		ret.set_string(this.exp_CurLayerPropName);
	};    
	Exps.prototype.CurLayerPropValue = function (ret)
	{
		ret.set_string(this.exp_CurLayerPropValue);
	};    
	Exps.prototype.CurTilesetPropName = function (ret)
	{
		ret.set_string(this.exp_CurTilesetPropName);
	};    
	Exps.prototype.CurTilesetPropValue = function (ret)
	{
		ret.set_string(this.exp_CurTilesetPropValue);
	};     
	Exps.prototype.CurTilePropName = function (ret)
	{
		ret.set_string(this.exp_CurTilePropName);
	};    
	Exps.prototype.CurTilePropValue = function (ret)
	{
		ret.set_string(this.exp_CurTilePropValue);
	};    
	Exps.prototype.CurMapPropName = function (ret)
	{
		ret.set_string(this.exp_CurMapPropName);
	};    
	Exps.prototype.CurMapPropValue = function (ret)
	{
		ret.set_string(this.exp_CurMapPropValue);
	};    	
    
    // duration
	Exps.prototype.RetrievingPercent = function (ret)
	{     
	    ret.set_float(this.exp_RetrievingPercent);
	};		
}());

(function ()
{
    cr.plugins_.Rex_JSONTMXImporter.TMXKlass = function(JSON_string, isIE)
    {
        var dict_obj= JSON.parse(JSON_string);;
        this.map = _get_map(dict_obj);
        this.tilesets = _get_tilesets(dict_obj);
        this.layers = _get_layers(dict_obj);
        this.objectgroups = _get_objectgroups(dict_obj);       
    };
    var TMXKlassProto = cr.plugins_.Rex_JSONTMXImporter.TMXKlass.prototype;

    TMXKlassProto.GetTileSet = function (gid)
    {
        var tilesets_cnt = this.tilesets.length;
        var i, tileset;
        for (i=tilesets_cnt-1; i>=0; i--)
        {
            tileset = this.tilesets[i];
            if (gid >= tileset.firstgid)
                return tileset;
        }
        return null;    
    }; 
    
    // RGB -> BGR
    var _get_C2_color_number = function(rgb_string) 
    {
        if (rgb_string == "")
            return null;
        
        var rgb = parseInt(rgb_string.substring(1), 16);
        var r = (rgb >> 16) & 0xFF;
        var g = (rgb >> 8) & 0xFF;
        var b = (rgb) & 0xFF;
        return ( (b<<16) | (g<<8) | (r) );
    };

    var _get_map = function (dict_obj)
    {     
        var map = {};  
        dict_obj = dict_obj["map"];
        map.orientation = _get_string_value(dict_obj, "@orientation");
        map.width =  _get_number_value(dict_obj, "@width");
        map.height = _get_number_value(dict_obj, "@height");
        map.tilewidth = _get_number_value(dict_obj, "@tilewidth");
        map.tileheight = _get_number_value(dict_obj, "@tileheight");
        map.backgroundcolor = _get_C2_color_number(_get_string_value(dict_obj, "@backgroundcolor", ""));
        map.properties = _get_properties(dict_obj);
        return map;           
    };
    var _get_tilesets = function (dict_obj)
    {  
        dict_obj = dict_obj["map"]["tileset"];
        if (dict_obj == null)
            return {};
                    
        var tileset, tilesets = [];        
        if (dict_obj.length)
        {
            var tileset_cnt = dict_obj.length;
            var i;
            for (i=0; i<tileset_cnt; i++)
            {
                tileset = _get_tileset(dict_obj[i]);
                if (tileset != null)
                    tilesets.push(tileset);
            }
        }
        else
        {
            tileset = _get_tileset(dict_obj);
            if (tileset != null)
                tilesets.push(tileset);
        }
        return tilesets;
    };
    var _get_tileset = function(dict_obj)
    {
        var tileset = {};    
        tileset.name = _get_string_value(dict_obj, "@name");
        tileset.firstgid = _get_number_value(dict_obj, "@firstgid");
        tileset.tilewidth = _get_number_value(dict_obj, "@tilewidth");
        tileset.tileheight = _get_number_value(dict_obj, "@tileheight");
        tileset.spacing = _get_number_value(dict_obj, "@spacing");
        tileset.margin = _get_number_value(dict_obj, "@margin"); 
        tileset.tiles = _get_tiles(dict_obj, tileset.firstgid);
        tileset.properties = _get_properties(dict_obj);
        return tileset;
    };
    var _get_tiles = function(dict_obj, gid_offset)
    {
        dict_obj = dict_obj["tile"];
        if (dict_obj == null)
            return {};
            
        var id, tiles = {};  
        if (dict_obj.length)
        {
            var tile_cnt = dict_obj.length;
            var tile, i;
            for (i=0; i<tile_cnt; i++)
            {
                tile = dict_obj[i];
                id = _get_number_value(tile, "@id") + gid_offset;
                tiles[id] = _get_tile(tile);
            }
        }
        else
        {
            id = _get_number_value(dict_obj, "@id") + gid_offset;
            tiles[id] = _get_tile(dict_obj);
        }
        return tiles;
    };
    var _get_tile = function(dict_obj, xml_tile)
    {    
        var tile = {};
        tile.properties = _get_properties(dict_obj);
        return tile;
    };
    var _get_layers = function (dict_obj)
    {       
        dict_obj = dict_obj["map"]["layer"];
        if (dict_obj == null)
            return {};
        
        var layer, layers = [];        
        if (dict_obj.length)
        {
            var layer_cnt = dict_obj.length;
            var i;
            for (i=0; i<layer_cnt; i++)
            {
                layer = _get_layer(dict_obj[i]);
                if (layer != null)
                    layers.push(layer);
            }
        }
        else
        {
            layer=_get_layer(dict_obj);
            if (layer != null)
                layers.push(layer);
        }
        return layers;
    };    
    var _get_layer = function (dict_obj)
    {        
        var visible = _get_string_value(dict_obj, "@visible");
        if (visible == "0")
            return null;
            
        var layer = {};    
       
        layer.name = _get_string_value(dict_obj, "@name");
        layer.width = _get_number_value(dict_obj, "@width");
        layer.height = _get_number_value(dict_obj, "@height");        
        layer.opacity = _get_number_value(dict_obj, "@opacity", 1);
        layer.properties = _get_properties(dict_obj);
        layer.data = _get_data(dict_obj["data"]);
        return layer;
    };
    var _get_data = function (dict_obj, xml_data)
    {
        var encoding = _get_string_value(dict_obj, "@encoding");
        var compression = _get_string_value(dict_obj, "@compression");      
        var data = _get_string_value(dict_obj, "#text");
        
        if(typeof(String.prototype.trim) === "undefined")
        {
            String.prototype.trim = function() 
            {
                return String(this).replace(/^\s+|\s+$/g, '');
            };
        }
        
        data = data.trim();
        if (encoding == "base64")
        {
            data = atob(data);
            data = data.split('').map(function(e) {
                return e.charCodeAt(0);
            });
            
            if (compression == "zlib")
            {
                var inflate = new window["Zlib"]["Inflate"](data);
                data = inflate["decompress"]();
            }
            else if (compression == "gzip")
            {
                var gunzip = new window["Zlib"]["Gunzip"](data);
                data = gunzip["decompress"]();               
            }
            data = _array_merge(data);
        }
        else if (encoding == "csv")
            data = _decCSV(data);
        else
            alert ("TMXImporter: could not decompress data");             
        return data;
    };
    var _get_objectgroups = function (dict_obj)
    {
        dict_obj = dict_obj["map"]["objectgroup"];
        if (dict_obj == null)
            return [];        
        var objectgroup, objectgroups = [];        
        if (dict_obj.length)
        {
            var objectgroups_cnt = dict_obj.length;
            var i;
            for (i=0; i<objectgroups_cnt; i++)
            {
                objectgroup = _get_objectgroup(dict_obj[i]);
                objectgroups.push(objectgroup);
            }
        }
        else
        {
            objectgroup = _get_objectgroup(dict_obj);
            objectgroups.push(objectgroup);
        }
        return objectgroups;
    };
    var _get_objectgroup = function (dict_obj)
    {
        var objectgroup = {};    
        objectgroup.name = _get_string_value(dict_obj, "@name");
        objectgroup.width = _get_number_value(dict_obj, "@width");
        objectgroup.height = _get_number_value(dict_obj, "@height");       
        objectgroup.objects = _get_objects(dict_obj);    
        return objectgroup;
    };
    var _get_objects = function(dict_obj)
    {
        dict_obj = dict_obj["object"];
        var object, objects = [];        
        if (dict_obj.length)
        {
            var objects_cnt = dict_obj.length;
            var i;
            for (i=0; i<objects_cnt; i++)
            {
                object = _get_object(dict_obj[i]);
                objects.push(object);
            }
        }
        else
        {
            object = _get_object(dict_obj);
            objects.push(object);
        }
        return objects;
    };   
    var _get_object = function(dict_obj)
    {    
        var object = {};
        object.name = _get_string_value(dict_obj, "@name");
        object.type = _get_string_value(dict_obj, "@type"); 
        object.x = _get_number_value(dict_obj, "@x");
        object.y = _get_number_value(dict_obj, "@y");          
        object.width = _get_number_value(dict_obj, "@width");
        object.height = _get_number_value(dict_obj, "@height");
        object.properties = _get_properties(dict_obj);
        return object;
    };    

    var _get_properties = function (dict_obj)
    {  
        if (dict_obj["properties"] == null)
            return {};
            
        dict_obj = dict_obj["properties"]["property"];
        var properties = {};
        var name, value;    
        if (dict_obj.length)
        {
            var i, prop_cnt=dict_obj.length; 
            for (i=0; i<prop_cnt; i++)
            {
                name = _get_string_value(dict_obj[i], "@name");
                value = _get_string_value(dict_obj[i], "@value");
                properties[name] = value;
            }
        }
        else
        {
            name = _get_string_value(dict_obj, "@name");
            value = _get_string_value(dict_obj, "@value");
            properties[name] = value;
        }
        return properties;
    };
    var _string2int = function(s, default_value)
    {
        return (s!=null)? parseInt(s):default_value;
    };    

    var _array_merge = function(data) 
    {
   	    var bytes = 4;
   	    var len = data.length / bytes;
   	    var arr = [];
   	    var i, j, tmp;
   
   	    for (i = 0; i<len; i++) 
   	    {
            tmp = 0;
   		    for (j = bytes - 1; j >= 0; --j) 
                tmp += ( data[(i * bytes) + j] << (j << 3) );
            arr[i] = tmp;
   	    }  
        arr.length = len;
        return arr;
    };  
    
    var _decCSV = function(data) 
    {     
        data = data.replace(/(^\s*)|(\s*$)/g,"");
        data = data.split(",");
        var data_cnt = data.length;
        var i,entries;
        var arr = [];
        for(i=0; i<data_cnt; i++)
            data[i] = _string2int(data[i]);
        return data;
    };
    
      
    cr.plugins_.Rex_JSONTMXImporter.LayoutKlass = function(plugin, OX, OY, width, height, is_isometric)
    {
        this.plugin = plugin;
        this.is_isometric = is_isometric;
        this.PositionOX = OX;
        this.PositionOY = OY;
        this.SetWidth(width);
        this.SetHeight(height);
    };
    var LayoutKlassProto = cr.plugins_.Rex_JSONTMXImporter.LayoutKlass.prototype;
      
	LayoutKlassProto.SetWidth = function(width)
	{
        this.width = width;
        this.half_width = width/2;        
	}; 
	LayoutKlassProto.SetHeight = function(height)
	{
        this.height = height;
        this.half_height = height/2;        
	};   
    LayoutKlassProto.LXYZ2PX = function(logic_x, logic_y)
	{
        var x = (this.is_isometric)? ((logic_x - logic_y)*this.half_width):
                                     (logic_x*this.width);
        return x+this.PositionOX;
	};
	LayoutKlassProto.LXYZ2PY = function(logic_x, logic_y)
	{
        var y = (this.is_isometric)? ((logic_x + logic_y)*this.half_height):
                                     (logic_y*this.height);
        return y+this.PositionOY;
	};
    LayoutKlassProto.CreateItem = function(obj_type,x,y,layer)
	{
        return this.plugin.runtime.createInstance(obj_type, layer,this.LXYZ2PX(x,y),this.LXYZ2PY(x,y) );         
	}; 

    var _get_string_value = function (obj, key, default_value)
    {
        var val = obj[key];
        if (val == null)
            val = default_value;
        return val;
    };
    var _get_number_value = function (obj, key, default_value)
    {
        var val = obj[key];
        if (val == null)
            val = default_value;
        else
            val = parseInt(val);
        return val;
    };    
}());    