;(function (factory) {
    /* CommonJS module. */
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory(window);
        /* AMD module. */
    } else if (typeof define === "function" && define.amd) {
        define(factory(window));
        /* Browser globals. */
    } else {
        factory(window);
    }
}(function(global, undefined) {
    "use strict";

    var veCropProtytype = veCrop.prototype;
    //默认参数
    var defaults = {
        img: '',	//图片对象
        frame: '',  //拖动框
        cropFrame: '', //裁剪框
        frameBorderWidth: 0, //裁剪框边框
        Touch: touch	//手势库
    };

    /*****************************************************************************************************************
     * 工具函数
     ****************************************************************************************************************/
    /**
     * 简单的数组合并
     */
    function extend(source, target) {
        for(var key in source) {
            if(source.hasOwnProperty(key))
                target[key] = source[key];
        }
        return target;
    }

    /**
     * devicePixelRatio设备像素比 webkitBackingStorePixelRatio Canvas缓冲区的像素比
     * 作用就是让Canvas中每个像素和手机屏幕的物理像素1：1对应，在Canvas中画线或写字可以更清晰
     */
    function pixelRatio(ctx) {
        var backingstore = ctx.webkitBackingStorePixelRatio|| 1;
        return (window.devicePixelRatio || 1) / backingstore;
    }

    /**
     * 角度换算为弧度
     * @param deg
     * @returns {number}
     */
    function radian(deg) {
        return deg * Math.PI / 180;
    }
    function sin(digit, deg) {
        return digit * Math.sin(radian(deg));
    }
    function cos(digit, deg) {
        return digit * Math.cos(radian(deg));
    }

    /**
     * 0--90°与180°--270°之间的宽高计算
     */
    function caculate1(width, height, deg) {
        var canvasWidth = (cos(width, deg) + sin(height, deg));
        var canvasHeight = (sin(width, deg) + cos(height, deg));
        return [canvasWidth, canvasHeight];
    }

    /**
     * 90°--180°与270°--360°之间的宽高计算
     */
    function caculate2(width, height, deg) {
        var canvasWidth = (sin(width, deg) + cos(height, deg));
        var canvasHeight = (cos(width, deg) + sin(height, deg));
        return [canvasWidth, canvasHeight];
    }

    /**
     * 旋转后canvas宽高，以及偏移设置
     * @param deg 角度
     * @param width 图片实际宽度
     * @param height 图片实际高度
     * @param pr 设备像素比与Canvas缓冲区的像素比的比率
     * @returns {*[]}
     */
    function rotateCanvas(deg, width, height, pr) {
        var caculate, x=0, y=0;
        if(deg <= 90) {
            caculate = caculate1(width, height, deg);
            x = sin(height, deg);
        }else if(deg <= 180) {
            deg = deg - 90;
            caculate = caculate2(width, height, deg);
            x = caculate[0];
            y = sin(height, deg);
        }else if(deg <= 270) {
            deg = deg - 180;
            caculate = caculate1(width, height, deg);
            x = cos(width, deg);
            y = caculate[1];
        }else if(deg <= 360) {
            deg = deg - 270;
            caculate = caculate2(width, height, deg);
            y = cos(width, deg);
        }
        return [caculate[0]/pr, caculate[1]/pr, x/pr, y/pr];
    }

    /**
     * 将框内的图片裁剪出来
     * @param ctx
     * @param image
     * @param offset
     */
    function drawImage(ctx, image, offset) {
        var pr = pixelRatio(ctx), key;
        ctx.save();

        for(key in offset.image) {
            offset.image[key] = Math.floor(offset.image[key]);
        }
        for(key in offset.frame) {
            offset.frame[key] = Math.floor(offset.frame[key]);
        }

        ctx.drawImage(image[0] || image,
            offset.image.x, offset.image.y, offset.image.w, offset.image.h,
            offset.frame.x * pr, offset.frame.y * pr, offset.frame.w * pr, offset.frame.h * pr);

        ctx.restore();
    }

    /*****************************************************************************************************************
     * 对象
     ****************************************************************************************************************/
    function veCrop(opts) {
        if(!opts.img) {
            throw new Error('请传入正确的图片');
        }
        this.opts = extend(opts, defaults); //默认参数与传入参数合并
        this.init();
        this.initTouch();
    }

    /**
     * 更新图片尺寸
     * @param width
     * @param height
     */
    veCropProtytype.setSize = function(width, height) {
        //var id = this.opts.img.getAttribute('id');
        //this.opts.img = document.getElementById(id);
        width && this.opts.img.setAttribute('data-width', width);//实际宽度
        height && this.opts.img.setAttribute('data-height', height);//实际高度
    };

    /**
     * 初始化参数
     */
    veCropProtytype.init = function() {
        this.param = {
            offsetX : 0,//X轴偏移
            offsetY : 0,//Y轴偏移
            scale : 1,//缩放倍数
            deg : 0//角度
        };
        this.opts.img.style.webkitTransform = '';//清除图片属性
    };

    /**
     * 设置param参数
     */
    veCropProtytype.getParam = function() {
        return this.param;
    };

    /**
     * 裁剪生成
     */
    veCropProtytype.generate = function(fn) {
        //this.updateImage();
        var image = this.opts.img, _this = this;
        var cropFrame = this.opts.cropFrame;
        var frameOffset = cropFrame.getBoundingClientRect();
        var src = this.filterImage(image);//旋转平移缩放后的图片

        var img = new Image();
        var originWidth = image.getAttribute('data-width'),//图片原始的宽高
            originHeight = image.getAttribute('data-height');
        img.onload = function() {
            _this.setSize(this.width, this.height);//将旋转后的图片尺寸临时存放在全局img中

            var canvas = document.createElement('canvas');
            canvas.width = frameOffset.width;//裁剪框的宽高
            canvas.height = frameOffset.height;
            var ctx = canvas.getContext('2d');

            ctx.fillStyle = '#FFF';//绘制背景色
            ctx.fillRect(0,0,canvas.width,canvas.height);

            var params = _this.intersect(cropFrame);//计算裁剪框与操作后的图片位置关系

            drawImage(ctx, this, params);//在旋转放大平移后的图片中选中位置裁剪

            var base64 = canvas.toDataURL('image/jpeg');

            _this.setSize(originWidth, originHeight);
            fn && fn.call(this, base64);
        };
        img.src = src;
    };

    /**
     * 操作图片 压缩/旋转
     * @param image 图片对象
     * @param coor 操作参数,宽高角度
     * @returns {string}
     */
    veCropProtytype.filterImage = function(image, coor) {
        coor = coor || {};
        var canvas = document.createElement('canvas'),
            width = coor['width'] || image.getAttribute('data-width'),//图片真实宽度
            height = coor['height'] || image.getAttribute('data-height'),
            deg = coor['deg'] || this.param.deg;//图片真实高度
        var pr = pixelRatio(canvas.getContext('2d'));
        var caculate;
        //将负值转换成正值
        if(deg < 0) {
            deg = deg + 360;
        }
        deg = deg % 360;
        if(deg) {
            caculate = rotateCanvas(deg, width, height, pr);
            canvas.width = caculate[0];
            canvas.height = caculate[1];
        }else {
            canvas.width = width / pr;//回复为原先的大小
            canvas.height = height / pr;
        }
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFF';//绘制背景色
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if(deg) {
            ctx.translate(caculate[2], caculate[3]);
            ctx.rotate(radian(deg));
            ctx.drawImage(image, 0, 0);
        }else {
            ctx.drawImage(image, 0, 0, width, height);
        }
        return canvas.toDataURL('image/jpeg', 0.5);//压缩质量为.5
    };

    /**
     * 操作图片旋转缩放拖动
     * @param offx
     * @param offy
     * @param scale
     * @param deg
     */
    veCropProtytype.formatTransform = function(offx, offy, scale, deg) {
        var translate = 'translate3d(' + (offx + 'px,') + (offy + 'px,') + '0)';
        var scaleStr = 'scale3d('+scale+','+scale+','+scale+')';
        var rotate = 'rotate('+deg+'deg)';
        this.opts.img.style.webkitTransform =  translate + ' ' + scaleStr + ' ' + rotate;
    };

    /**
     * 初始化手势事件 目前是touch.js，可以做更多的适配
     */
    veCropProtytype.initTouch = function() {
        var currScale, _this = this,
            Touch = this.opts.Touch,
            frame = this.opts.frame;

        Touch.on(frame, 'rotate', function (ev) {
            var totalAngle = _this.param.deg + ev.rotation;
            if(ev.fingerStatus === 'end'){
                _this.param.deg = _this.param.deg + ev.rotation;
            }
            _this.formatTransform(_this.param.offsetX, _this.param.offsetY, _this.param.scale, totalAngle);
        });

        Touch.on(frame, 'touchstart', function (ev) {
            ev.preventDefault();
        });

        Touch.on(frame, 'drag', function(ev) {
            var currOffx = _this.param.offsetX + ev.x;
            var currOffy = _this.param.offsetY + ev.y;
            _this.formatTransform(currOffx, currOffy, _this.param.scale, _this.param.deg);
        });

        Touch.on(frame, 'dragend', function(ev) {
            _this.param.offsetX += ev.x;
            _this.param.offsetY += ev.y;
        });

        Touch.on(frame, 'pinch', function(ev) {
            if(typeof ev.scale != 'undefined') {
                currScale = ev.scale - 1 + _this.param.scale;
                _this.formatTransform(_this.param.offsetX, _this.param.offsetY, currScale, _this.param.deg);
            }
        });

        Touch.on(frame, 'pinchend', function() {
            _this.param.scale = currScale;
        });
    };

    /**
     * 计算出图片img在frame裁剪框中的可见部分相对于img和frame的坐标及尺寸
     * @param cropFrame 裁剪框
     * @returns {{frame: {x: number, y: number, w: number, h: number}, image: {x: number, y: number, w: number, h: number}}}
     */
    veCropProtytype.intersect = function(cropFrame) {
        var imgX = 0, imgY = 0, imgW = 0, imgH = 0;
        var frmX = 0, frmY = 0;
        var imgOffset, frmOffset;
        var left, right, top, bottom;
        var img = this.opts.img,
            frameBorderWidth = this.opts.frameBorderWidth,
            frameBorderWidth2X = frameBorderWidth * 2;

        imgOffset = img.getBoundingClientRect();//图片的偏移对象
        frmOffset = cropFrame.getBoundingClientRect();//裁剪框的偏移对象
        left = imgOffset.left - frmOffset.left - frameBorderWidth;//图片到边框左边的距离 去除边框宽度
        right = left + imgOffset.width;//图片宽度需要减去边框的宽度
        top = imgOffset.top - frmOffset.top - frameBorderWidth;//图片到边框上边的距离
        bottom = top + imgOffset.height;

        //图片在画框内
        if(!(right <= 0 || left >= frmOffset.width || bottom <= 0 || top >= frmOffset.height)) {
            if(left < 0) {
                imgX = -left;
                frmX = 0;
                imgW = (right < frmOffset.width) ? right : frmOffset.width;
            } else {
                imgX = 0;
                frmX = left;
                imgW = (right < frmOffset.width ? right : frmOffset.width) - left;
            }

            if(top < 0) {
                imgY = -top;
                frmY = 0;
                imgH = (bottom < frmOffset.height) ? bottom : frmOffset.height;
            } else {
                imgY = 0;
                frmY = top;
                imgH = ((bottom < frmOffset.height) ? bottom : frmOffset.height) - top;

            }
        }

        var ratio = img.getAttribute('data-width') / imgOffset.width;//图片真实宽度 与 图片CSS宽度
        //图片的实际高度不能低于计算后的高度 否则iphone 5S中就不显示
        var imageHeight = imgH * ratio;
        if(+img.getAttribute('data-height') < imageHeight) {
            imageHeight = img.getAttribute('data-height');
        }

        return {
            frame: {x: frmX, y: frmY, w: (imgW + frameBorderWidth2X), h: (imgH + frameBorderWidth2X)},//此处画框是650，而画布是654
            image: {x: imgX * ratio, y: imgY * ratio, w: imgW * ratio, h: imageHeight}
        };
    };

    global.veCrop = veCrop;
    return veCrop;
}));

