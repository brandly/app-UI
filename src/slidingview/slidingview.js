/*
THIS SOFTWARE IS PROVIDED BY ANDREW M. TRICE ''AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL ANDREW M. TRICE OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
	var SlidingView = function( sidebarId, bodyId ) {

		this.gestureStarted = false;
		this.bodyOffset = 0;

		this.sidebarWidth = 250;

		this.sidebar = $("#" + sidebarId);
		this.body = $("#" + bodyId);

		this.sidebar.addClass( "slidingview_sidebar" );
		this.body.addClass( "slidingview_body" );

		var self = this;
		$(window).resize( function(event){ self.resizeContent(); } );
		$(this.parent).resize( function(event){ self.resizeContent(); } );

		if ( "onorientationchange" in window ) {
			$(window).bind( "onorientationchange", function(event){ self.resizeContent(); } )
		}
		this.resizeContent();
		this.setupEventHandlers();
	}

	SlidingView.prototype.setupEventHandlers = function() {

		this.touchSupported =  ('ontouchstart' in window);

		this.START_EVENT = this.touchSupported ? 'touchstart' : 'mousedown';
		this.MOVE_EVENT = this.touchSupported ? 'touchmove' : 'mousemove';
		this.END_EVENT = this.touchSupported ? 'touchend' : 'mouseup';

		var self = this;
		var func = function( event ){ self.onTouchStart(event), true };
		var body = this.body.get()[0];
		body.addEventListener( this.START_EVENT, func, false );
	}

	SlidingView.prototype.onTouchStart = function(event) {

		this.gestureStartPosition = this.getTouchCoordinates( event );

		var self = this;
		this.touchMoveHandler = function( event ){ self.onTouchMove(event) };
		this.touchUpHandler = function( event ){ self.onTouchEnd(event) };

		this.body.get()[0].addEventListener( this.MOVE_EVENT, this.touchMoveHandler, false );
		this.body.get()[0].addEventListener( this.END_EVENT, this.touchUpHandler, false );
		this.body.stop();
	}

	SlidingView.prototype.onTouchMove = function(event) {
		var currentPosition = this.getTouchCoordinates( event );

		if ( this.gestureStarted ) {
			event.preventDefault();
			event.stopPropagation();
			this.updateBasedOnTouchPoints( currentPosition );
			return;
		}

		// calculate offsets to see if scroll direciton is vertical or horizontal
	    var xOffset = Math.abs(currentPosition.x - this.gestureStartPosition.x);
	    var yOffset = Math.abs(currentPosition.y - this.gestureStartPosition.y);

		// Dragging vertically - ignore this gesture
		if ( yOffset > xOffset ) return this.unbindEvents();

		//dragging horizontally - let's handle this
		this.gestureStarted = true;
		event.preventDefault();
		event.stopPropagation();
		this.updateBasedOnTouchPoints( currentPosition );
		return;
	}

	SlidingView.prototype.onTouchEnd = function(event) {
		if ( this.gestureStarted ) {
			this.snapToPosition();
		}
		this.gestureStarted = false;
		this.unbindEvents();
	}

	SlidingView.prototype.updateBasedOnTouchPoints = function( currentPosition ) {

		var deltaX = (currentPosition.x - this.gestureStartPosition.x);
		var targetX = this.bodyOffset + deltaX;

		targetX = Math.max( targetX, 0 );
		targetX = Math.min( targetX, this.sidebarWidth );

		this.bodyOffset = targetX;

		if ( this.body.css("left") != "0px" ) {
			this.body.css("left", "0px" );
		}
		this.body.css("-webkit-transform", "translate3d(" + targetX + "px,0,0)" );
		this.body.css("-moz-transform", "translate3d(" + targetX + "px,0,0)" );
		this.body.css("transform", "translate3d(" + targetX + "px,0,0)" );

		this.sidebar.trigger( "slidingViewProgress", { current: targetX, max:this.sidebarWidth } );

		this.gestureStartPosition = currentPosition;
	}

	SlidingView.prototype.snapToPosition = function() {
		this.body.css("left", "0px" );
		var currentPosition = this.bodyOffset;
		var halfWidth = this.sidebarWidth / 2;
		var targetX;
		if ( currentPosition < halfWidth ) {
			targetX = 0;
		}
		else {
			targetX = this.sidebarWidth;
		}
		this.bodyOffset = targetX;

		if ( currentPosition != targetX ) {
			this.updateCSS(targetX);
		    this.sidebar.trigger( "slidingViewProgress", { current:targetX, max:this.sidebarWidth } );
		}
	}

	SlidingView.prototype.toggle = function() {
		if (this.isClosed())
			this.open();
		else
			this.close();
	}

	SlidingView.prototype.open = function() {
		this.updateCSS(this.sidebarWidth);
	}

	SlidingView.prototype.close = function() {
		this.updateCSS(0);
	}

	SlidingView.prototype.isClosed = function() {
		return Boolean(this.bodyOffset === 0)
	}

	SlidingView.prototype.isOpened = function() {
		return Boolean(this.bodyOffset !== 0)
	}

	SlidingView.prototype.updateCSS = function(targetX) {
		this.bodyOffset = targetX;
		this.body.css("-webkit-transform", "translate3d(" + targetX + "px,0,0)" );
		this.body.css("-moz-transform", "translate3d(" + targetX + "px,0,0)" );
		this.body.css("transform", "translate3d(" + targetX + "px,0,0)" );
	}

	// Remove touch events handlers
	SlidingView.prototype.unbindEvents = function() {
		this.body.get()[0].removeEventListener( this.MOVE_EVENT, this.touchMoveHandler, false );
		this.body.get()[0].removeEventListener( this.END_EVENT, this.touchUpHandler, false );
	}

	// Returns x, y coordinates
	SlidingView.prototype.getTouchCoordinates = function(event) {
		if ( this.touchSupported ) {
			var touchEvent = event.touches[0];
			return { x:touchEvent.pageX, y:touchEvent.pageY }
		}
		else {
			return { x:event.screenX, y:event.screenY };
		}
	}

	// Determine width of body, based on orientation
	SlidingView.prototype.resizeContent = function() {

		var $window = $(window)
	    var w = $window.width();
	    var h = $window.height();

	    this.body.width( w );
	}

	window.SlidingView = SlidingView;

}());
