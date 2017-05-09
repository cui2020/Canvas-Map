/*
	mapArea
	地图信息流向图
	-----------------------------------
	@version: 0.2.1
	@author: ektx
	@date: 2017-1-8
*/
function MapAreaChart(obj) {
	this.options = obj;
	this.cityArr = obj.city;
	this.cityArea = obj.cityArea;
	this.message = obj.message;
	this.callback = obj.callback;

	// 数据整理后的地图区域信息
	this.areas = [];

	this.ele = document.querySelector( obj.el );
	this.ctx = '';
	this.ctxW = 0;
	this.ctxH = 0;

	// 鼠标移动位置
	this.currentX = -1;
	this.currentY = -1;

	// 当前索引
	this.inAreaCtx = -1;

}

MapAreaChart.prototype = {

	setCtxState: function(styleOption) {

		this.ctx.save();
		this.ctx.beginPath();
	
		// canvas 属性请查阅 canvas 相关书籍
		for ( let i in styleOption) {
			this.ctx[i] = styleOption[i]
		}

	},

	drawLine: function(_options) {

		this.setCtxState( _options.style );

		var path = '';

		if (typeof _options.line == "string") {
			var _city = _options.line[_options.index];

			path = new Path2D(_options.line);

			if( this.ctx.isPointInPath(path, this.currentX, this.currentY) && _options.index > -1){
				index = _options.index;
				this.ctx.fillStyle = _options.hoveColor;
			}

			this.ctx.stroke(path);
			this.ctx.fill( path )

		} else {
	        for (let i = 0, l = _options.line.length; i < l; i+=2) {
				let x = _options.line[i];
                let y = _options.line[i+1];
	            if (i === 0) {
	                this.ctx.moveTo(x, y);
	            } else {
	                this.ctx.lineTo(x, y);
	            }
			}

			if( this.ctx.isPointInPath( this.currentX, this.currentY)){
                this.ctx.fillStyle = _options.style.hoveColor;
                this.inAreaCtx = _options.index;
            }

			this.ctx.stroke();
			this.ctx.fill();
		}

        this.ctx.closePath();
		this.ctx.restore();

	},


	getRandomPoint: function( _obj ) {
		let result = [];
		let _self = this;

		let getRandomVal = function(colorArr) {
			return colorArr[parseInt(colorArr.length * Math.random())]
		}

		for (let i = 0; i < _obj.point.size; i ++) {

			let x = y = 0;

			if (typeof _obj.data === 'string') {

				do {
	                x = parseFloat((_obj.x[0] + _obj.width * Math.random()).toFixed(2));
	                y = parseFloat((_obj.y[0] + _obj.height * Math.random()).toFixed(2));
	            } while (!_self.ctx.isPointInPath(new Path2D(_obj.data), x, y));
			} else {
				do {
	                x = parseFloat((_obj.x[0] + _obj.width * Math.random()).toFixed(2));
	                y = parseFloat((_obj.y[0] + _obj.height * Math.random()).toFixed(2));
	            } while (!_self.ctx.isPointInPath(x, y));
			}

            result.push({
            	x: x,
                y: y,
                r: getRandomVal( _obj.point.r ),
                color: getRandomVal( _obj.point.color )
            })
		}
        _obj.pointArr = result;
	},

	drawPoint: function( obj ) {

		let pointLength = obj.pointArr.length;

		if ( pointLength == 0) {
			this.getRandomPoint( obj );

			pointLength = obj.point.size;
		}

		for (let i = 0; i < pointLength; i++) {

			let _thisPoint = obj.pointArr[i];

			this.setCtxState( {
				fillStyle: _thisPoint.color
			} );

	        this.ctx.arc(_thisPoint.x, _thisPoint.y, _thisPoint.r, 0, 2*Math.PI, false);

	        this.ctx.fill();
			this.ctx.closePath();
	        this.ctx.restore();

			// 点上线
			this.drawMessage( _thisPoint );

		}
	},

	drawMessage: function( _point ) {

		let style = this.message.line;

		style.globalCompositeOperation = 'destination-over';

		this.drawLine({
			line: [_point.x, _point.y, this.message.center.x, this.message.center.y],
			style: style
		});

		if (!_point.lineLength) {

			_point.lineLength = parseFloat(Math.sqrt(Math.pow(_point.x, 2) + Math.pow(_point.y, 2)).toFixed(2));
			_point.width = this.message.center.x - _point.x;
			_point.height = this.message.center.y - _point.y;
			_point.xScale = _point.width / _point.lineLength;
			_point.yScale = _point.height / _point.lineLength;
			
			let speedRandom = Math.random() + .02;
			let _x = _point.x;
			let _xspeed = _point.width / this.message.speed * speedRandom;
			let _y = _point.y;
			let _yspeed = _point.height / this.message.speed * speedRandom;
			let cosA =  _point.height / _point.lineLength;
			let sinA = _point.width / _point.lineLength;
			
			if (this.message.direction == 'get') {
				_x = this.message.center.x;
				_y = this.message.center.y;
				_xspeed = 0 - _xspeed;
				_yspeed = 0 - _yspeed;
			}

			_point.light = {
				x: _x, // 原点 x
				y: _y, // 原点 y
				xs: _xspeed,
				ys: _yspeed,
				cos: cosA,
				sin: sinA,
				color: this.message.light.style.strokeStyle,
				bcolor: this.message.backColor || this.message.light.style.strokeStyle,
				t: 0
			}
		}


		let xStart = _point.light.x + _point.light.xs * _point.light.t;
		let yStart = _point.light.y + _point.light.ys * _point.light.t;

		let xEnd = xStart + this.message.light.length * _point.light.sin;
		let yEnd = yStart + this.message.light.length * _point.light.cos;

		if ( Math.abs(xStart - _point.light.x) > Math.abs(_point.width)) {
			_point.light.t = 0;

			if ( this.message.willback ) {
				// 切换方向
				if (_point.light.x === _point.x) {
					_point.light.x = this.message.center.x;
					_point.light.y = this.message.center.y;
					_point.light.xs = 0 - _point.light.xs;
					_point.light.ys = 0 - _point.light.ys;
				} 
				else if (_point.light.x === this.message.center.x) {
					_point.light.x = _point.x;
					_point.light.y = _point.y;
					_point.light.xs = 0 - _point.light.xs;
					_point.light.ys = 0 - _point.light.ys;
				}

				// 切换颜色
				if (this.message.backColor) {
					let _color = _point.light.color;
					_point.light.color = _point.light.bcolor;
					_point.light.bcolor = _color;
				}

			}
		}

		// 流入效果
		if (_point.light.x === _point.x) {
			if (Math.abs(xEnd - _point.light.x) > Math.abs(_point.width)) {
				xEnd = this.message.center.x;
				yEnd = this.message.center.y;
			}
		} 
		else if (_point.light.x === this.message.center.x) {
			if (Math.abs(xEnd - _point.x) > Math.abs(_point.width)) {
				xEnd = _point.light.x;
				yEnd = _point.light.y;
			}
		}

		this.message.light.style.globalCompositeOperation = 'source-over';
		this.message.light.style.strokeStyle = _point.light.color;

		_point.light.t++;

		this.drawLine({
			line: [
				xStart, 
				yStart, 
				xEnd, 
				yEnd, 
			],
			style: this.message.light.style
		}) 

	},

	drawCityName: function( _opt, index ) {

		if( this.inAreaCtx == index ){
			this.setCtxState( _opt.cityName.hover );
        } else {
			this.setCtxState( _opt.cityName.normal );
        }

		this.ctx.textAlign = 'center';

		this.ctx.fillText(_opt.name, _opt.xCenter, _opt.yCenter);
        
        this.ctx.restore();

	},

	drawCityArea: function( _opt ) {

		let style = this.cityArea.style;

		style.fillStyle = 'transparent';
		style.globalCompositeOperation = 'source-over';

		this.drawLine({
			line: this.cityArea.data,
			style: style
		})
	},

	animate: function() {
		let _self = this;

		let go = function() {

			_self.ctx.clearRect(0, 0, _self.ctxW, _self.ctxH);

			
			_self.drawCityArea();

			_self.areas.forEach(function(n, index) {

				let __style = n.style;
				__style.globalCompositeOperation = 'destination-over';
				_self.drawLine({
					line: n.data,
					style: __style,
					index: index
				})

				_self.drawPoint( n );

				_self.drawCityName( n, index )
			})

			requestAnimationFrame(go);
			// setTimeout(go, 200);
		}

		go()

	},

	// 计算属性
	computedData: function(data) {

		if (!data) {
			console.log('Not data value!')
			return
		}
		let width = height = xStart = yStart = xEnd = yEnd = 0;

		for (let i = 0, l = data.length; i < l; i+=2) {
			let x = data[i];
			let y = data[i+1];

			if (i === 0) {
				xStart = xEnd = x;
				yStart = yEnd = y;
				
			} else {
				xStart = x < xStart ? x : xStart;
				xEnd   = x > xEnd ? x : xEnd;

				yStart = y < yStart ? y : yStart;
				yEnd   = y > yEnd   ? y : yEnd;

			}
		}

		// 输出宽高
		width = xEnd - xStart;
		height = yEnd - yStart;

		return {
			width: width,
            height: height,
            xCenter: xStart + width / 2,
            yCenter: yStart + height / 2,
            x: [xStart, xEnd],
            y: [yStart, yEnd]
		}
	},

	event: function() {

		let _self = this;

	    //地图鼠标移上去的事件
		this.ele.addEventListener("mousemove", function(event){
		    _self.currentX = event.offsetX;
		    _self.currentY = event.offsetY;

		    // 在地图区域内
		    if (_self.inAreaCtx > -1) {
		        // 返回用户 数据索引 城市信息
		        if (_self.callback && _self.callback.mousemove) _self.callback.mousemove( _self.inAreaCtx, _self.areas[_self.inAreaCtx] );
		    } 
		    // 在地图外
		    else {
		        // 返回用户 -1
		        if (_self.callback && _self.callback.mousemove) _self.callback.mousemove( -1 );
		    }

		});

		// 地图上点击事件
		this.ele.addEventListener('click', function(e) {
		    // 在地图区域内
		    if (_self.inAreaCtx > -1) {

		        if (_self.callback && _self.callback.click) 
		            _self.callback.click( _self.inAreaCtx , _self.areas[_self.inAreaCtx] );
		    }
		})
	},

	setArea: function() {

		let _self = this;

		let Area = function(obj, computedData, cityInfo) {
			let hasX = 'x' in computedData;

			if (!obj.name) {
				console.warn('Don\'t have name!\n' );
				return;
			}

			this.name = obj.name;
			this.data = obj.map;

			this.width = obj.w || computedData.width;
			this.height = obj.h || computedData.height;
			this.x = hasX ? computedData.x : [obj.x, obj.x + obj.w];
			this.y = hasX ? computedData.y : [obj.y, obj.y + obj.h];
			this.xCenter = hasX ? computedData.xCenter : obj.x + obj.w /2;
			this.yCenter = hasX ? computedData.yCenter : obj.y + obj.h /2;

			this.point = cityInfo.point;
			this.pointArr = [];
			this.style = cityInfo.style;
			this.cityName = cityInfo.cityName;
		};

		for (let i = 0, l = this.options.city.data.length; i < l; i++) {
			let _data = this.options.city.data[i];
			let _computedData = {};

			// 如果没有宽高
			if (!_data.w && !_data.h) {
				// 计算宽高
				_computedData = this.computedData( _data.map )
			}

			this.areas[i] = new Area( _data, _computedData, this.options.city )
		}
	},

	createCanvas: function() {

		canvas = document.createElement('canvas');
		canvas.width = this.ctxW = parseFloat( this.ele.style.width || window.getComputedStyle(this.ele, null).width );
		canvas.height = this.ctxH = parseFloat( this.ele.style.height || window.getComputedStyle(this.ele, null).height );

		this.ele.appendChild( canvas );
		this.ctx = canvas.getContext('2d');

	},

	init: function() {

		this.createCanvas();

		this.setArea();

		this.animate();

		this.event();
	}
}