 $(document).ready(function() {

	 
    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
        };
    })();

	var world; 
	var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
	var gravity = 1;
	
	$('#gravity-toggle').on('click',function(){
		
		if(gravity == 1){
			gravity = 0;
			$(this).html('Turn gravity on');
		}
		else{
			gravity = 1;
			$(this).html('Turn gravity off');
		}
		
	});
	
	setupCanvas();
	$(window).resize(resizeCanvas);
	initBox2d();

	function setupCanvas(){
		canvas = $('#game');
		context = canvas.get(0).getContext('2d');
		canvasWidth = canvas.width();
		canvasHeight = canvas.height();
		resizeCanvas(); // after setup, resize to brower dimensions
	
	}
	
	function resizeCanvas(){
		canvas.attr('width', $(window).get(0).innerWidth);
		canvas.attr('height', $(window).get(0).innerHeight);
		canvasWidth = canvas.width();
		canvasHeight = canvas.height();
		
		c_width = 100.0;
		ppm = canvas.width/c_width;
		c_height = canvas.height/ppm;
		//context.setTransform(ppm, 0, 0, -ppm, 0, canvas.height);  
	}
	
	
	
	function initBox2d(){
			b2Vec2 = Box2D.Common.Math.b2Vec2,
			b2AABB = Box2D.Collision.b2AABB,
			b2BodyDef = Box2D.Dynamics.b2BodyDef,
			b2Body = Box2D.Dynamics.b2Body,
			b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
			b2Fixture = Box2D.Dynamics.b2Fixture,
			b2World = Box2D.Dynamics.b2World,
			b2MassData = Box2D.Collision.Shapes.b2MassData,
			b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
			b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
			b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
			b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;
	 
		// new world (gravity(x,y), doSleep?)
		world = new b2World(new b2Vec2(0,20), true);
		
		// fixtures attach shapes to bodies
		fixDef = new b2FixtureDef;
		fixDef.density = 0.7;
		fixDef.friction = 1;
		fixDef.restitution = 0.5;
		
		bodyDef = new b2BodyDef;



		function createBound(bpx,bpy,ssx,ssy){ // body.position.x, body.position.y, shape.size.x, shape.size.y
			bodyDef.type = b2Body.b2_staticBody;
			bodyDef.position.Set(bpx,bpy);
			bodyDef.userData = {
				'width':ssx * 2,
				'height':ssy * 2
			} 	
			fixDef.shape = new b2PolygonShape;
			fixDef.shape.SetAsBox(ssx,ssy);
			var body = world.CreateBody(bodyDef).CreateFixture(fixDef);
		}
		groundX = (canvasWidth / 30);
		groundY = (canvasHeight / 30);
		//createBound(groundX / 2, groundY, groundX/2, 0.03); // ground
		//createBound(0,0, groundX, 0.03); // ceiling
		//createBound(0,0,0.03,groundY); // left wall
		//createBound(groundX,0,0.03,groundY); // right wall
		
		
		
		createMagnet(groundX/2, groundY/2, 1);
		function createMagnet(bpx,bpy,radius){
			bodyDef.type = b2Body.b2_staticBody;
			bodyDef.position.Set(bpx,bpy);
			bodyDef.userData = {
				'radius':radius
			} 	
			fixDef.shape = new b2CircleShape(radius);	
			var body = world.CreateBody(bodyDef).CreateFixture(fixDef);			
		}

		
		var canvasPosition = getElementPosition(document.getElementById("game"));
		
		document.addEventListener("mousedown", function(e){
			isMouseDown = true;
			mouseX = (e.clientX - canvasPosition.x) / 30;
			mouseY = (e.clientY - canvasPosition.y) / 30;
			handleMouseMove(e);
            document.addEventListener("mousemove", handleMouseMove, true);
		}, false);
		
		document.addEventListener("mouseup", function(){
			document.removeEventListener("mousemove", handleMouseMove, true);
			isMouseDown = false;
			mouseX = undefined;
			mouseY = undefined;
		}, false);

         function handleMouseMove(e) {
            mouseX = (e.clientX) / 30;
            mouseY = (e.clientY) / 30;
         };



		function getElementPosition(element){
			var elem=element, tagname="", x=0, y=0;
			while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")){
				y += elem.offsetTop;
				x += elem.offsetLeft;
				tagname = elem.tagName.toUpperCase();
				if(tagname == "BODY") elem=0;
				if(typeof(elem) == "object") {
					if(typeof(elem.offsetParent) == "object") elem = elem.offsetParent;
				}
			}
			return {x: x, y: y};
		}
     
		//setup debug draw
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(document.getElementById("game").getContext("2d"));
		debugDraw.SetDrawScale(30.0);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		world.SetDebugDraw(debugDraw);
		

        (function hell() {
            update();
            requestAnimFrame(hell);
        })();

	};
	
	


	
	
		
	function update(){

/*
		if(isMouseDown && (!mouseJoint)){
			var body = getBodyAtMouse();
			if(body) {
				body.SetAwake(true);
			
			}
			else{
				createObject(mouseX, mouseY, 0.5, 0.5, 0); //mouseX, mouseY, width, height, gravity
			}
		}
*/
		
	 
		if(isMouseDown && (!mouseJoint)) {
		   var body = getBodyAtMouse();
		   if(body) {
		      var md = new b2MouseJointDef();
		      md.bodyA = world.GetGroundBody();
		      md.bodyB = body;
		      md.target.Set(mouseX, mouseY);
		      md.collideConnected = true;
		      md.maxForce = 300.0 * body.GetMass();
		      mouseJoint = world.CreateJoint(md);
		      body.SetAwake(true);
		   }
		   else{
		   	createObject(mouseX, mouseY, 0.3, 0.3, 0); //mouseX, mouseY, width, height, gravity
		   }
		}
		if(mouseJoint) {
		   if(isMouseDown) {
		      mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
		   } else {
		      world.DestroyJoint(mouseJoint);
		      mouseJoint = null;                  
		   }
		}
		
		
		
        
        var bodies = world.GetBodyList();
        var bodyCount = world.GetBodyCount();

		function useDebug(){ world.DrawDebugData(); }
		function useCanvas(){
			clearCanvas();
		    context.strokeStyle = '#fff';
		    context.fillStyle = '#fff';
		    context.lineWidth = 0.03
		    context.setTransform(30, 0, 0, 30, 0, 0);
		    
		    for(var i = 0; i < bodyCount; i++){
		    	var body = bodies.GetUserData();

		    	if(body){
			    	var position = bodies.GetPosition();
				    context.save();
				    context.translate(position.x, position.y);		        
				    context.rotate(bodies.GetAngle());
				    context.beginPath();
				    context.arc(0, 0, body.radius, 0, Math.PI * 2);
				    context.fill();
				    context.restore();
				    
				    // cancel gravity
				    var fx = bodies.GetMass() * world.GetGravity().x;
				    var fy = bodies.GetMass() * world.GetGravity().y;
				    bodies.ApplyForce(new b2Vec2(-fx,-fy), bodies.GetWorldCenter());
				    
				    // apply magnetic impulse
				    var impulseX, impulseY, planetX, planetY;
				    
				    planetX = (canvasWidth / 2) / 30;
				    planetY = (canvasHeight / 2) / 30;
				    moonX = position.x;
				    moonY = position.y
				    
				    distanceX = planetX - moonX;
				    distanceY = planetY - moonY;
								    
				var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY)
				impulseX = 0.1*distanceX / distance
				impulseY = 0.1*distanceY / distance
				    
/*
				    var mag = 5 / (distanceX * distanceX + distanceY * distanceY);
					var theta = Math.atan2(distanceY, distanceX);
					var impulseX = mag * Math.cos(theta);
					var impulseY = mag * Math.sin(theta);
*/
									    

				    //console.log(impulseX);
			
				    				
				    if(gravity == 1){
						bodies.ApplyImpulse(new b2Vec2(impulseX,impulseY), bodies.GetWorldCenter());	
					}
		    	}
				

				bodies = bodies.GetNext();
						    			 
		    }			
		}

		useCanvas();
		//useDebug();
		
		world.Step(
			1 / 60,	// frame-rate
			10,		// velocity iterations
			10		// position iterations
		);
		

		
		world.ClearForces();
	};
	
	function clearCanvas(){
		context.clearRect(0,0,canvasWidth, canvasHeight);
		context.beginPath();
	}	
	
 	function getBodyAtMouse() {
        mousePVec = new b2Vec2(mouseX, mouseY);
        var aabb = new b2AABB();
        aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
        aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
        
        // Query the world for overlapping shapes.
        selectedBody = null;
        world.QueryAABB(getBodyCB, aabb);
        return selectedBody;
     }
     function getBodyCB(fixture) {
        if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
           if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
              selectedBody = fixture.GetBody();
              return false;
           }
        }
        return true;
     }

	function createObject(mouseX, mouseY, radius){
		bodyDef.type = b2Body.b2_dynamicBody;
		bodyDef.position.Set(mouseX, mouseY);
		bodyDef.angle = 0;
		bodyDef.userData = {
			'radius':radius,
		} 	
		fixDef.shape = new b2CircleShape(radius);
		var body = world.CreateBody(bodyDef).CreateFixture(fixDef);
		
	}
			
			
	function randomFromTo(from, to){
		 return Math.random() * (to - from) + from;
	}

});