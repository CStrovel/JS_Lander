        //Written by: Charles Strovel
        //assignment 2
        //ITEC 345-851
        //This script is a lunar landard game

        //get shortcut 
		get = id => document.getElementById(id);
        
        //on load handler
        function onLoadHandler(){
            //hide the restart button
            get("RESTART").style.display = "none";

            //main function call
            main();
        }

		//create a canvas object
		theMoon = {
			//moon variables 
			canvas : get("PLAY_AREA"),
			surface: [],
			xMin : 0,
			xMax : 1890,
			yMin : 0,
			yMax : 950,
			LSLength : 100,
			chunkLength : 50,
            contourSlope : 2,
            image: "flag.png",

			start : function () {
                //image for the surface flag at the landing site 
                this.img = new Image();
                this.img.src = this.image;
                //canvas settings
				this.canvas.width = this.xMax; 
				this.canvas.height = this.yMax;
				//get the context of the canvas for drawing purposes 
				this.context = this.canvas.getContext("2d");
				//get an array representing surface contours
				this.surface = getSurface(this.xMin, this.xMax, this.yMin, this.yMax, 
				this.LSLength, this.chunkLength, this.contourSlope);
			},
			makeSurface : function () { 
				drawSurface(this.surface, this.xMin, this.xMax,
                this.yMin, this.yMax);
                drawFlag(this.surface, this.img);
			}

		}
		//generates a new game-----------------------------------------------------
		//-------------------------------------------------------------------------
		function main(){
			//generate a new game state, but wait for player to click the button to start
            setUpNewGame();

            //add event listener only once
			document.addEventListener('keydown', processKey);


        }
        //sets up a new game, for intialization and------------------------------
        //new game button--------------------------------------------------------
        function setUpNewGame(){
            eagle = new lander(35, 37, "frame_5_delay-0.1s.gif", 0 , 0, 100, 100);
            theMoon.start();
            updateGameState(eagle);

        }
        //wrapper for startTimer() so it can be time delayed---------------------
        //-----------------------------------------------------------------------
        function startT(){
            setTimeout(startTimer, 1000);
            get("START_BTN").style.display = "none";
            get("ORBIT_BTN").style.display = "none";
            

        }
        //starts the games primary timer-----------------------------------------
        //-----------------------------------------------------------------------
        function startTimer(){
            //declare a new eagle to clear any inputs that may have been loaded while waiting
            eagle = new lander(35, 37, "frame_5_delay-0.1s.gif", 0 , 0, 100, 100);
            //display the restart button
            get("RESTART").style.display = "inline";
            //start game timer 
            document.gameTimer = setInterval(() => updateGameState(eagle),17);

        }

		//updates the screen state----------------------------------------------
		//----------------------------------------------------------------------
		function updateGameState(obj){
			//things that need to be updated with each timer click
			theMoon.makeSurface();
			obj.update();
		}

		//constructor for lander game object------------------------------------
		//----------------------------------------------------------------------
		function lander(width, height, image, x, y, XMV, YMV){
			//assign lander image 
			this.img = new Image();
			this.img.src = image;

			//physical characteristics
			this.width = width;
			this.height = height;
			this.xVel = 0;
			this.yVel = 0;
			this.impactTolerance = 4;
			this.crashed = false;

			//location
			this.x = x;
			this.y = y;

			//max velocitys
			this.XMV = XMV;
			this.YMV = YMV;

			//update function that changes the landers
			//on screen location
			this.update = function(){
				var ctx = theMoon.context;
				//acceleration due to gravity 
				gravity(this, 60);
				//check for intersection with walls or surface
				boundsCheckS(this,theMoon.surface);
				boundsCheckLR(this, theMoon.xMin, theMoon.xMax);
				//move the landers x/ys
				moveObj(this);
				//draw in new location
				ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

			}
			//this function is called when the lander contacts any-------------------------
			//part of the moons surface----------------------------------------------------
			this.touchDown = function (){
				//if the lander is off target
				if(!theMoon.surface[Math.round(this.x)].LS || 
				!theMoon.surface[Math.round(this.x) + this.width].LS){
					//end the game with a crash and tell the user why
					this.crash();
					gameOver("You Missed The Landing Site", "red");

				//if the lander impacts the landing site too hard	
				} else if(this.impactTolerance <(this.xVel ** 2 + this.yVel **2) ** (1/2)){
					//end the game with a crash and tell the user why
					this.crash();
					gameOver("You Hit The Landing Site Too Hard", "red");

				} else {
					gameOver("YOU WIN, Nice Landing!", "blue");
				}
				//stop the game timer
				clearInterval(document.gameTimer);

			}
			//what happens if the lander hits the pad too fast----------------------------
			//or misses the surface-------------------------------------------------------
			this.crash = function(){
				this.img = new Image();
				this.img.src = "XCVT.gif";

			}
		}

		//finishes the game with an  ending message---------------------------------------
		//--------------------------------------------------------------------------------
		function gameOver(message, color){
			//draw the game over message on the screen
			ctx = theMoon.context;
			ctx.fillStyle = color; 
			ctx.font = "30px Courier New"
			ctx.fillText(message, (theMoon.xMin + theMoon.xMax/4), theMoon.yMin + 100);
		}
		//function to handle key input
		function processKey(keyEvent){
    	//left and right acceleration
    		if(keyEvent.key == "ArrowLeft" || keyEvent.key == "A"){
        		accelerateX(eagle,-.5);
   
    		}

    		if(keyEvent.key == "ArrowRight" || keyEvent.key == "D"){
        		accelerateX(eagle, .5);
      
    		}

    		//up acceleration (lunar landers do not have down thrusters)
  			if(keyEvent.key == "ArrowUp"  || keyEvent.key == "W"){
       			accelerateY(eagle, -1);
       
  	 		}

		}
		//produces an array of values reprsenting x,y---------------------------
		//values for 2d terrain-------------------------------------------------
		function getSurface(xMin, xMax, yMin, yMax, LSLength, maxChunkLength, maxContourSlope){
			//declare variables
			var surface = [];
            var x = 0;
            //get a random starting point for y
			var yPoint = yStart(yMin,yMax);
			var xJump = 0;  
			var slope = 0;
			var landingSite = false; 
			var LSStart = getLSStart(xMin, xMax, LSLength);
			
			//loop for every point on x plane
			while(x <= xMax){
				//get an xJump that is at least one and less then maxChunkLength  
				xJump = Math.round(Math.random() * (maxChunkLength - 1) + 1) + x;
				slope = Math.random() * maxContourSlope * randInvert();
				
				//get the x and y values for this chunk of x 
				for(x; x <= xJump; ++x){
					//if not on landing site
					if(x < LSStart || x > LSStart + LSLength){
						yPoint = yPoint + slope;
						landingSite = false; 
					} else {
						//if the point is part of the landing site  
						landingSite = true;
					}
					//push new object containing y cord and landing site bool 
					//but only if it is less then maxX
					if(x < xMax){surface.push({y: Math.round(yPoint), LS: landingSite});}	
				}	
			}

			return surface; 
		}

		//draws the surface contours on screen----------------------------------
		//----------------------------------------------------------------------
		function drawSurface(surface, xMin, xMax, yMin, yMax){
			//declare variables
			var ctx = theMoon.context;
			
			//fill the background
			ctx.fillStyle = "black";
			ctx.fillRect(xMin,yMin, xMax, yMax);
			//start path in the lower left hand corner 
			ctx.beginPath(); 
			ctx.lineTo(0,yMax);

			//draw surface features
			for(i in surface){
				ctx.lineTo(i,surface[i].y);

			}
			
			//close up the shape and fill it
			ctx.lineTo(i, yMax);
			ctx.fillStyle = "gray";
			ctx.fill();
            ctx.closePath();
			
		}
        //draws a flag at the landing site to indicate it to the player----------
        //-----------------------------------------------------------------------
        function drawFlag(surface, img){
            //get canvas context
            var ctx = theMoon.context;
            var flagPoint = {
                x: 0, 
                y: 0
            };

            for(i in surface){
                if(surface[i].LS){
                    //set flag point to the current surface x,y pair 
                    flagPoint.x = i;
                    flagPoint.y = surface[i].y
                }
            }

            ctx.drawImage(img, flagPoint.x - 5, flagPoint.y - 37, 30, 37);
        }
		//determines a value for the y cordinate to start terrain generation----
		//----------------------------------------------------------------------
		function yStart(yMin, yMax){
			var y = yMin - 1;//enter loop at least once

			while(y < yMin || y > yMax){
				y = Math.round(((yMin + yMax) / 2) + (yMin + yMax / (Math.random() * 2 + 4)) - 180);

			}

			return y;
		}

		//determines a location for the landing site to start at----------------
		//----------------------------------------------------------------------
		function getLSStart(minX, maxX, LSLength){
			var x = minX - 1;//enters loop at least once

			//get a suitable x, above minX and below maxX - landing site length 
			while(x < minX || x + LSLength > maxX){
				x = Math.round(Math.random() * maxX - LSLength); 
			}

			return x; 	
		}
		
		//returns a 1 or -1 for randomly getting the ---------------------------
		//inverse of a number---------------------------------------------------
		function randInvert(){return Math.round(Math.random()) * 2 - 1;}
		
		//adjusts the x/y cordinants of an object acording to its---------------
		//current velocity------------------------------------------------------
		function moveObj(obj){
    		//get the objects current x/y and adjust 
    		var x = parseInt(obj.x) + obj.xVel;
    		var y = parseInt(obj.y) + obj.yVel;

   		 	//assign new x/y to object
    		obj.x = x;
			obj.y = y;

		}
		

		//function that replicates gravity--------------------------------------
		//use a higher interval for faster timers-------------------------------
		function gravity(obj, interval){
   			accelerateY(obj, 5/interval);

		}

		//function that adds to an objects velocities in y plane, upto max-----
		//obj: an object must have yVel and YMV--------------------------------
		function accelerateY(obj,accY){
   			//if object velocity + accleration is less then max in either direction,
    		//accelerate the object
    		if(obj.yVel + accY < obj.YMV && obj.yVel + accY > obj.YMV * -1){

     		   obj.yVel += accY; 
    
   			} else {
    		    //if adding more velocity will take the object over its maximum velocity 
      			//set object to maximum velocity instead yVel / by its absolute value
      	 		//returns 1 with the correct sign 
     		    obj.yVel = obj.YMV * (yVel / Math.abs(yVel))
    
  			}
    
		}
		
		//function that adds to an objects velocities in x plane, upto max-----
		//obj: an object must have xVel and XMV--------------------------------
		function accelerateX(obj,accX){
    		//if object velocity + accleration is less then max in either direction,
    		//accelerate the object 
    		if(obj.xVel + accX < obj.XMV && obj.xVel + accX > obj.XMV * -1){
        
        		obj.xVel += accX; 

    		} else {
        		//if adding more velocity will take the object over its maximum velocity 
        		//set object to maximum velocity instead xVel / by its absolute value
        		//returns 1 with the correct sign 
        		obj.xVel = obj.XMV * (xVel / Math.abs(xVel));

    		}
		}

		//function that detects colision with surface--------------------------
		//boundary, using array of surface y cords-----------------------------
		function boundsCheckS(obj, surface){
			   if(surface[Math.round(obj.x)].y <= obj.y + obj.height ||
			    surface[Math.round(obj.x + obj.width)].y <= obj.y ){
				obj.touchDown();
				obj.yVel = 0;
				obj.xVel = 0;

			}
		  }
		// function that detects collison with the left and right boundary-----
		// bounces the lander back if the lander contacts it-------------------
		function boundsCheckLR(obj,xMin, xMax){
			//if the object is at or has exceeded left boundry
			//bounce it back in and stop its momentum in that direction
			if(obj.x <= xMin + 2){
				obj.x = obj.x + Math.abs(xMin - obj.x) + 1;
				obj.xVel = 1;
			//do the same for the right boundary  
			} else if (obj.x + obj.width >= xMax - 15){
				 obj.x = xMax - obj.width - 15; 
				obj.xVel = -1;
			}
        }
        
        //restarts the game---------------------------------------------------
        //--------------------------------------------------------------------
        function restart(){
            //change the buttons that are showing 
            get("START_BTN").style.display = "inline";
            get("ORBIT_BTN").style.display = "inline";
            get("RESTART").style.display = "none";
            
            //clear the games timing loop
            clearInterval(document.gameTimer);

            //clear the board and start a new game state
            setUpNewGame();
        }

	
