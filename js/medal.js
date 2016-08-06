var $upload = $('[name=upload]'),
    $frameImg = $('#frameImg'),
    $frame = $('#inner'),
    $innerFrame = $('#innerFrame'),
    $again = $('#again'),
    $btnBegin = $('#btnBegin'),
    $btnLogin = $('#btnLogin'),
    $btnClient = $('#btnClient'),
    $template = $('#template'),
    $split = $('#split'),
    $sample = $('#sample'),
    $first = $('#first'),
    $second = $('#second'),
    header,
    bid=1001,
    CrossImg,//客户端跨域图片
    host = url.current('h5.chelun.com', 'h5dev.chelun.com'),
    ajaxHost = url.current('//chezhu.eclicks.cn/','//chezhutest.eclicks.cn/'),
    isDoning = false;//防止二次提交


Zepto(function() {

    var header;
    var href = location.href;
    /**
     * 体能值
     */
    env.ready(function() {
        user.init(env);
        //排除预热页面
        if(href.indexOf('wait.html') < 0) {
            header = new Header();
            if($upload.length <= 0) {
                return;
            }

            //微信客户端不需要登录
            if(is.isWeiXin()) {

                $btnClient.show();//展示登录按钮
                $upload.show();
            }else {
                if(!env.isLogin || !is.isCheLunApp()) {
                    //$btnLogin.show();//展示登录按钮
                }

                $('#btnLogin').click(()=>{
                    new Login(()=>{
                        //$btnBegin.show();
                        //$btnLogin.hide();
                        $upload.show();
                        showUploadBtn(true);
                        header.update();
                    });
                });
                // new Login({
                //     binder: '#btnLogin',
                //     onLogin: ()=>{
                //         //$btnBegin.show();
                //         $btnLogin.hide();
                //         $upload.show();
                //         showUploadBtn(true);
                //         header.update();
                //     }
                // });
            }
            new Footer();
        }

    });


    /**
     * 预加载图片
     */
    $("img[data-src]").each(function () {
        var $this = $(this);
        var src = $this.data('src');
        dom.preImage(src, function () {
            $this.attr('src', src);
        });
    });
    /**
     * 气泡提示
     */
    var $tip = $('#tip'),
    //$h3 = $tip.find('h3'),
        $span = $tip.find('span'),
        setHidden;
    $('#tag').on('touchstart', 'dd', function(e) {
        if(setHidden) {
            clearTimeout(setHidden);
        }
        $tip.removeClass('tip-fadeOut');
        var $this = $(this),
            offset = $this[0].getBoundingClientRect();//坐标信息

        //console.log($this[0].getBoundingClientRect())
        $tip.find('h3').html($this.data('item'));
        //var tip = document.getElementById('tip');
        $tip.show();
        var tipWidth = $tip[0].offsetWidth,
            tipHeight = $tip[0].offsetHeight,
            spanHeight = $span[0].offsetHeight,
            spanWidth = $span[0].offsetWidth/1.5,
            top = offset.top - tipHeight - spanHeight + window.pageYOffset;
        //console.log(tipWidth);console.log(tipHeight);
        $tip[0].style.removeProperty('left');
        $tip[0].style.removeProperty('right');
        $span[0].style.removeProperty('left');
        $span[0].style.removeProperty('right');
        //如果偏移+提示宽度大于屏幕宽度
        if(offset.left+tipWidth > window.innerWidth) {
            $span.css('right', spanWidth);
            $tip.css('right', window.innerWidth-offset.left-offset.width);
        }else {
            $span.css('left', spanWidth);
            $tip.css('left', offset.left);
        }
        $tip.css('top', top);
        $span.css('top', tipHeight-2);
        // console.log(top);
        //console.log(tipHeight-2);
        //setHidden = setTimeout(function() {
        //    $tip.addClass('tip-fadeOut');
        //}, 3000);
    });

    /**
     * 上传图片的操作
     */
    if($upload.length > 0) {
        if(env.isLogin) {
            showUploadBtn(true);
            //$btnBegin.show();
            //$btnLogin.hide();
            $upload.show();

        }
        //上传配置
        upload();
    }

    /**
     * 我的奖牌
     */
    if($template.length > 0) {
        user.loading();
        //'3516993b60a36a32af5cc59601ae16df'
        $.get(ajaxHost+'olympicAct/getMyMedalInfo', {user_token:env.token}, function(json) {
            user.loadingHidden();
            if(!json.data || json.data.length==0) {
                return;
            }
            var data = json.data;
            if(data.num) {
                $('#gold').html(data.num.gold);
                $('#silver').html(data.num.silver);
                $('#bronze').html(data.num.copper);
            }
            if(!data.map) {
                return;
            }
            var list = [];
            $.each(data.map.gold, function(key, value) {
                var map = {
                    name: key,
                    reward: value['has_num'],
                    total: value['event_num']
                };
                delete value['event_num'];
                delete value['has_num'];
                var map2 = [];
                $.each(value, function(key2, value2) {
                    var un = value2>0 ? '' : 'un-start';
                    map2.push({name:key2, unReward:un})
                });
                map['list'] = map2;
                list.push(map);
            });
            var html = Mustache.render(document.getElementById('template').innerHTML, {data:list});
            document.getElementById('tag').innerHTML = html;
        }, 'json');
    }

    /**
     * 预热
     */
    var $btnPraise = $('#btnPraise');
    if($btnPraise.length > 0) {
        $btnPraise.on('touchstart', function() {
            $.get(ajaxHost+'olympicAct/approve', {}, function(json) {
                if(json.code != 0) {
                    user.alert('抱歉', json.msg);
                    return;
                }
                $('#yellow').html(json.data.approve_num);
                $btnPraise.addClass('has');
                $btnPraise.parent().append('<div class="second"></div>')
                //$('<div class="second"></div>').after($btnPraise);
            }, 'json');
        });
        $.get(ajaxHost+'olympicAct/getApprove', {}, function(json) {
            if(json.code != 0) {
                user.alert('抱歉', json.msg);
                return;
            }
            $('#yellow').html(json.data.approve_num);
            //倒计时
            var a = json.data.diff_time;
            fomtime(a);
        }, 'json');
    }

    /**
     * 裁剪图片 夺金牌
     */
    $btnBegin.on('touchstart', function(e) {
        var $this = $(this);
        e.preventDefault();
        if(poster.check() || $this.attr('disabled')) {
            return;
        }
        $this.attr('disabled', true);
        var dialog = user.contest();
        setTimeout(function() {
            //document.getElementById('txt').innerHTML = poster.param.deg;
            var src = poster.filterImage(CrossImg, $frameImg.data('width'), $frameImg.data('height'), poster.param.deg);
            //$('#frameImg2').attr('src', src);
            //alert(33)
            var img = new Image();
            img.onload = function() {
                $frameImg.data('width', this.width);
                $frameImg.data('height', this.height);
                //$frameImg.attr('src', src);
                generatePoster(this, $this, dialog, header);
            };
            img.src = src;
        }, 5000);


        //$('#frameImg2').attr('src', src);
    });

    /**
     * 旋转图片
     */
    $('#btnRotate').on('touchstart', function(e) {
        e.preventDefault();
        if(poster.check()) {
            return;
        }
        poster.param.deg += 90;
        poster.formatTransform($frameImg[0], poster.param.offx, poster.param.offy, poster.param.scale, poster.param.deg);
    });
});


function fomtime(a) {
    a = a-1;
    var d = parseInt(a / 24/60/60);
    var h = parseInt((a/(60*60))%24);
    var m = parseInt(a/60%60);
    var s = parseInt(a%60);
    document.getElementById('day').innerHTML= d;
    document.getElementById('hour').innerHTML= h;
    document.getElementById('minute').innerHTML= m;
    document.getElementById('second').innerHTML= s;
    setTimeout(function() {
        fomtime(a);
    }, 1000);
}

/**
 * 客户端环境下显示或隐藏上传按钮
 */
function showUploadBtn(isShow) {
    var $btn;
    if(is.isCheLunApp()) {
        $btn = $btnClient;
    }else {
        $btn = $btnBegin;
    }
    if(isShow) {
        $btn.show();
    }else {
        $btn.hide();
    }
}
window.onload = function() {
    endLoading();
    //user.alert('抱歉', '未能识别出车牌信息，请将车牌清晰完整放置绿色框内');
    if($upload.length > 0) {
        //图片拖拽
        poster.initTouch($frame[0], $frameImg[0]);
    }
    //next($loading);
};

/**
 * 生成海报
 */
function generatePoster(image, $btn, dialog, header) {
    var canvas = document.createElement('canvas');
    canvas.width = $innerFrame.width();//CSS中定义了画布是650
    canvas.height = $innerFrame.height();
    //console.log(canvas.width)
    //console.log(canvas.height)
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFF';//绘制背景色
    ctx.fillRect(0,0,canvas.width,canvas.height);

    var params = poster.intersect($innerFrame, $frameImg);
    //console.log(params)
    poster.drawImage(ctx, image, params);

    var base64 = canvas.toDataURL('image/jpeg');

    //将base64数据上传到服务器中并做判断
    $.post(ajaxHost+'LicenseScan/carScan', {bid:bid, img:base64, user_token:env.token, app:env.getActApp()}, function(json) {
        if(!json) {
            $btn.removeAttr('disabled');
            dialog.close();
            return;
        }
        if(json.code != 1) {
            $btn.removeAttr('disabled');
            dialog.close();
            user.alert('抱歉', '未能识别出车牌信息，请将车牌清晰完整放置绿色框内');
            return;
        }
        user.getMedal(json, dialog, header, $btn);
        //location.href = 'index.html';
    }, 'json');


    //$('#frameImg2').attr('src', base64);
}

/**
 * 当第一次上传结束后
 */
function uploadEnd($this) {
    $this.remove();
    $again.show();
    $btnBegin.show().html('开始夺金');
    $split.show();
    $sample.hide();
}
/**
 * 上传逻辑
 */
function upload() {
    /**
     * 普通终端上传图片
     */
    $upload.on('change', function() {
        var file = $(this)[0].files[0];
        var $this = $(this);
        if(!file) {//undefined
            return;
        }
        if(!startLoading()) {
            return;
        }
        var reader = new FileReader();
        reader.readAsDataURL(file);// 将文件以Data URL形式进行读入页面
        reader.onload = function() {
            var base64 = this.result;

            var img  = new Image();
            img.onload = function() {
                var src = poster.filterImage(img, this.width, this.height);//IOS中如果图片过大，将不能画在canvas中
                $frameImg.data('width', this.width);//实际宽度
                $frameImg.data('height', this.height);//实际高度
                poster.init($frameImg[0]);
                var realImg = new Image();
                realImg.onload = function() {
                    CrossImg = realImg;
                    $frameImg.attr('src', realImg.src);//三次载入Base64数据
                    endLoading();
                };
                realImg.src = src;
                //realImg.src = '/img/demo.png';
            };
            img.src = base64;
        };
        //console.log($this)
        if($this.hasClass('file1')) {
            uploadEnd($this);
            $first.hide().next().show();
        }else {
            //解决上传相同文件不触发onchange事件
            //var clone = this.cloneNode(true);
            //clone.onchange = arguments.callee; //克隆不会复制动态绑定事件
            //clone.value = '';
            //this.parentNode.replaceChild(clone, this);
        }

    });
    //}
}

/**
 * 事件开始
 */
function startLoading() {
    if(isDoning) {
        return false;
    }
    user.loading();
    isDoning = true;
    return true;
}
/**
 * 事件结束
 */
function endLoading() {
    user.loadingHidden();
    isDoning = false;
}

var poster = {
    param: {
        offx : 0,
        offy : 0,
        scale : 1,
        deg : 0
    },
    /**
     * 检测是否可以操作
     */
    check: function() {
        return $frameImg.attr('src') == 'img/blank.gif';
    },
    /**
     * 初始化各个参数
     */
    init: function(img) {
        this.param = {offx : 0, offy : 0, scale : 1, deg : 0};
        img.style.webkitTransform = '';//清除$frameImg中的style属性
    },
    /**
     * devicePixelRatio设备像素比 webkitBackingStorePixelRatio Canvas缓冲区的像素比
     */
    pixelRatio: function(ctx) {
        var backingstore = ctx.webkitBackingStorePixelRatio|| 1;
        return (window.devicePixelRatio || 1) / backingstore;
    },
    /**
     * 角度换算成弧度
     */
    radian: function(deg) {
        return deg * Math.PI / 180;
    },
    sin: function(digit, deg) {
        return digit * Math.sin(this.radian(deg));
    },
    cos: function(digit, deg) {
        return digit * Math.cos(this.radian(deg));
    },
    /**
     * 0--90°与180°--270°之间的宽高计算
     */
    caculate1: function(width, height, deg) {
        var canvasWidth = (this.cos(width, deg) + this.sin(height, deg));
        var canvasHeight = (this.sin(width, deg) + this.cos(height, deg));
        return [canvasWidth, canvasHeight];
    },
    /**
     * 90°--180°与270°--360°之间的宽高计算
     */
    caculate2: function(width, height, deg) {
        var canvasWidth = (this.sin(width, deg) + this.cos(height, deg));
        var canvasHeight = (this.cos(width, deg) + this.sin(height, deg));
        return [canvasWidth, canvasHeight];
    },
    /**
     * 旋转后canvas宽高，以及偏移设置
     */
    rotateCanvas: function(deg, width, height, pr) {
        var caculate, x=0, y=0;
        if(deg <= 90) {
            caculate = this.caculate1(width, height, deg);
            x = this.sin(height, deg);
        }else if(deg <= 180) {
            deg = deg - 90;
            caculate = this.caculate2(width, height, deg);
            x = caculate[0];
            y = this.sin(height, deg);
        }else if(deg <= 270) {
            deg = deg - 180;
            caculate = this.caculate1(width, height, deg);
            x = this.cos(width, deg);
            y = caculate[1];
        }else if(deg <= 360) {
            deg = deg - 270;
            caculate = this.caculate2(width, height, deg);
            y = this.cos(width, deg);
        }
        return [caculate[0]/pr, caculate[1]/pr, x/pr, y/pr];
    },
    /**
     * 将选中的图片放入Canvas中，防止在IOS中由于图片太大而不显示
     * 旋转操作也放在此处
     */
    filterImage: function(image, width, height, deg) {
        var canvas = document.createElement('canvas');
        var pr = this.pixelRatio(canvas.getContext('2d'));
        var caculate;
        if(deg < 0) {
            deg = deg + 360;
        }
        deg = deg % 360;
        if(deg) {
            caculate = this.rotateCanvas(deg, width, height, pr);
            canvas.width = caculate[0];
            canvas.height = caculate[1];
        }else {
            canvas.width = width / pr;//回复为原先的大小
            canvas.height = height / pr;
        }
        //if(deg) {
        //    canvas.width = width ;//回复为原先的大小
        //    canvas.height = height ;
        //}
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFF';//绘制背景色
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if(deg) {
            //var move = this.sin(height, deg)/pr;
            ctx.translate(caculate[2], caculate[3]);
            //ctx.translate(0, 0);
            ctx.rotate(this.radian(deg));
            //ctx.translate(canvas.width/2, canvas.height/2);
            //ctx.translate(this.sin(height, deg)/pr, 0);

            //document.getElementById('txt').innerHTML += '|'+ caculate[2] + '|' + caculate[3];
            //ctx.translate(move, 0);
            //ctx.setTransform(1, 1, 0, 0, move, 0)
            //ctx.drawImage(image, 0, -canvas.width);
            ctx.drawImage(image, 0, 0);
            //return canvas.toDataURL('image/png');
        }else {
            ctx.drawImage(image, 0, 0, width, height);
            //return canvas.toDataURL('image/jpeg', 0.7);
        }

        return canvas.toDataURL('image/jpeg', 0.5);
    },
    /**
     * 画图
     */
    drawImage: function(ctx, image, offset) {
        var pr = this.pixelRatio(ctx), key;
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
    },
    /**
     * 设置transform属性
     */
    formatTransform: function(img, offx, offy, scale, deg) {
        if(this.check()) {
            return;
        }
        var translate = 'translate3d(' + (offx + 'px,') + (offy + 'px,') + '0)';
        var scaleStr = 'scale3d('+scale+','+scale+','+scale+')';
        var rotate = 'rotate('+deg+'deg)';
        //console.log(img.style.webkitTransform)
        img.style.webkitTransform =  translate + ' ' + scaleStr + ' ' + rotate;
    },
    /**
     * 初始化拖拽,放缩事件
     * 开源库touch.js
     */
    initTouch: function(touchPad, img) {

        var currScale, _this = this;

        var _this = this;
        touch.on(touchPad, 'rotate', function (ev) {
            //deg = angle + ev.rotation;
            var totalAngle = _this.param.deg + ev.rotation;
            if(ev.fingerStatus === 'end'){
                _this.param.deg = _this.param.deg + ev.rotation;
            }
            //var txt = document.getElementById('text').innerHTML;
            //txt = totalAngle+'|'+ev.rotation+'<br>';
            //document.getElementById('text').innerHTML = txt;
            _this.formatTransform(img, _this.param.offx, _this.param.offy, _this.param.scale, totalAngle);
            //ev.preventDefault();
        });

        touch.on(touchPad, 'touchstart', function (ev) {
            //ev.startRotate();
            ev.preventDefault();
        });

        touch.on(touchPad, 'drag', function(ev) {
            var currOffx = _this.param.offx + ev.x;
            var currOffy = _this.param.offy + ev.y;
            _this.formatTransform(img, currOffx, currOffy, _this.param.scale, _this.param.deg);
        });

        touch.on(touchPad, 'dragend', function(ev) {
            _this.param.offx += ev.x;
            _this.param.offy += ev.y;
        });

        touch.on(touchPad, 'pinch', function(ev) {
            if(typeof ev.scale != 'undefined') {
                currScale = ev.scale - 1 + _this.param.scale;
                _this.formatTransform(img, _this.param.offx, _this.param.offy, currScale, _this.param.deg);
            }
        });

        touch.on(touchPad, 'pinchend', function() {
            _this.param.scale = currScale;
        });
    },
    /**
     * 计算出img在frame中的可见部分相对于img和frame的坐标及尺寸
     */
    intersect: function($frame, $img) {
        var imgX = 0, imgY = 0, imgW = 0, imgH = 0;
        var frmX = 0, frmY = 0;
        var imgOffset, frmOffset;
        var left, right, top, bottom;

        imgOffset = $img.offset();//图片的偏移对象
        frmOffset = $frame.offset();//画框的偏移对象
        left = imgOffset.left - frmOffset.left - 2;//图片到边框左边的距离 去除2px的边框
        right = left + imgOffset.width;//图片宽度需要减去边框的宽度 就是650
        top = imgOffset.top - frmOffset.top - 2;//图片到边框上边的距离
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

        var ratio = $img.data('width') / $img.width();//图片真实宽度 与 图片CSS宽度
        //图片的实际高度不能低于计算后的高度 否则iphone 5S中就不显示
        var imageHeight = imgH * ratio;
        if(+$img.data('height') < imageHeight) {
            imageHeight = $img.data('height');
        }

        return {
            frame: {x: frmX, y: frmY, w: (imgW + 4), h: (imgH + 4)},//此处画框是650，而画布是654
            image: {x: imgX * ratio, y: imgY * ratio, w: imgW * ratio, h: imageHeight}
        };
    }
};

