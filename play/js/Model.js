/***************************

A MODEL:
- Draggable candidates & voter(s)
- Has to draw & up 'em up & down appropriately.

***************************/

function Model(config){

	var self = this;

	// Properties
	config = config || {};
	self.id = config.id || "model";
	self.size = config.size || 300;
	self.scale = config.scale || 1; // TO DO: actually USE this.
	self.border = config.border || 10;

	// RETINA canvas, whatever.
	var canvas = document.createElement("canvas");
	canvas.setAttribute("class", "interactive");
	canvas.width = canvas.height = self.size*2; // retina!
	canvas.style.width = canvas.style.height = self.size+"px";
	canvas.style.borderWidth = self.border+"px";
	var ctx = canvas.getContext("2d");
	self.canvas = canvas;
	self.ctx = ctx;

	// My DOM: title + canvas + caption
	self.dom = document.createElement("div");
	self.dom.setAttribute("class", "model");
	self.dom.style.width = (self.size+2*self.border)+"px"; // size+2*borders!
	self.title = document.createElement("div");
	self.title.id = "title";
	self.caption = document.createElement("div");
	self.caption.id = "caption";
	self.caption.style.width = self.dom.style.width;
	self.dom.appendChild(self.title);
	self.dom.appendChild(self.canvas);
	self.dom.appendChild(self.caption);

	// MAH MOUSE
	self.mouse = new Mouse(self.id, self.canvas);

	// Draggables
	self.draggables = [];
	self.draggableManager = new DraggableManager(self);

	// Candidates & Voter(s)
	self.candidates = [];
	self.candidatesById = {};
	self.voters = [];
	self.addCandidate = function(id, x, y){
		var candidate = new Candidate({
			model: self,
			id:id, x:x, y:y
		});
		self.candidates.push(candidate);
		self.draggables.push(candidate);
		self.candidatesById[id] = candidate;
	};
	self.addVoters = function(config){
		config.model = self;
		var DistClass = config.dist;
		var voters = new DistClass(config);
		self.voters.push(voters);
		self.draggables.push(voters);
	};

	// Init!
	self.onInit = function(){}; // TO IMPLEMENT
	self.init = function(){
		self.onInit();
		self.update();
	};

	// Reset!
	self.reset = function(noInit){
		self.candidates = [];
		self.candidatesById = {};
		self.voters = [];
		self.draggables = [];
		if(!noInit) self.init();
		self.tracer = [];
	};

	// Update!
	self.onUpdate = function(){}; // TO IMPLEMENT
	self.tracerold = Array.apply(null, Array(5)).map(function(){return [0,0,0]});
	self.me_moving_new = 0;
	self.tracer = Array.apply(null, Array(50)).map(function(){return [0,0,0]});
	self.winnerColor = [];
	//self.tracer = [];
	self.update = function(){
	
		// Clear it all!
		ctx.clearRect(0,0,canvas.width,canvas.height); // keep it if we are dragging something

		// Move the one that's being dragged, if any
		if(Mouse.dragging){
			Mouse.dragging.moveTo(Mouse.x, Mouse.y);
			var fill = model.canvas.style.borderColor;
			var fill = self.winnerColor[0]; //_clone(self.winnerColor); // this modification traces the history of who won
			var tracernew = []
			self.me_moving_old = self.me_moving_new;
			for(var i=0; i<self.candidates.length; i++){
				var c = self.candidates[i];
				var setnew = [c.x*2,c.y*2,fill];
				tracernew.push(setnew);
				if (self.tracerold[i][0] != setnew[0] | self.tracerold[i][1] != setnew[1]) {				
					self.tracer.push(setnew);
					self.me_moving_new = i;
				}
			}
			self.tracerold = tracernew;
			if (self.me_moving_new != self.me_moving_old) {
				self.tracer = [];
			}
			self.tracer = self.tracer.slice(-400);
			//self.tracer.splice(0,Math.abs(self.tracer.length-10));
			spiral_data(); // get the additional data from dragging
		} else {
			if ( ! flag_dont_clear_tracer) {self.tracer = [];ctx.clearRect(0,0,canvas.width,canvas.height);}
			flag_dont_clear_tracer = false;
		}

		
		
		// DRAW 'EM ALL.
		// Draw voters' BG first, then candidates, then voters.
		
		// Draw nn
		draw2();
		
		// Draw tracer
		ctx.strokeStyle = 'rgb(0,0,0)';
		ctx.lineWidth = 1;
    
		for(var i=0; i<self.tracer.length; i++){
			var trace = self.tracer[i];
			x = trace[0];
			y = trace[1];
			fill = trace[2];
			ctx.fillStyle = fill; // make a circle
			ctx.beginPath();
			var size = 10;
			//ctx.fillRect(x-size/2, y-size/2, size, size);
			ctx.arc(x, y, size*.5, 0, Math.TAU, true);
			ctx.fill();
			ctx.stroke();
		}
		
		for(var i=0; i<self.voters.length; i++){
			var voter = self.voters[i];
			voter.update();
			voter.draw(ctx);
		}
		for(var i=0; i<self.candidates.length; i++){
			var c = self.candidates[i];
			c.update();
			c.draw(ctx);
		}

		// Update!
		self.onUpdate();
		publish(self.id+"-update");

	};

	// HELPERS:
	self.getBallots = function(){
		var ballots = [];
		for(var i=0; i<self.voters.length; i++){
			var voter = self.voters[i];
			ballots = ballots.concat(voter.ballots);
		}
		return ballots;
	};
	self.getTotalVoters = function(){
		var count = 0;
		for(var i=0; i<self.voters.length; i++){
			var voter = self.voters[i];
			count += voter.points.length;
		}
		return count;
	};


};

function _clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}